package io.metamask.nativesdk

import com.crypto.ecies.Ecies

internal enum class KeyExchangeMessageType {
    NONE,
    KEY_HANDSHAKE_START,
    KEY_HANDSHAKE_CHECK,
    KEY_HANDSHAKE_SYN,
    KEY_HANDSHAKE_SYNACK,
    KEY_HANDSHAKE_ACK,
}

internal data class KeyExchangeMessage(val type: String, val publicKey: String?)

/**
 * ECIES key exchange state for a single bound dapp client.
 * Each client gets its own instance so keys are never shared between callers.
 */
internal class KeyExchange {
    private val ecies = Ecies()
    private val privateKey: String = ecies.privateKey()
    val publicKey: String = ecies.publicKeyFrom(privateKey)
    private var theirPublicKey: String? = null

    @Volatile
    var keysExchanged: Boolean = false
        private set

    fun encrypt(message: String): String {
        val key = theirPublicKey ?: throw IllegalStateException("theirPublicKey is null")
        return ecies.encrypt(key, message)
    }

    fun decrypt(message: String): String = ecies.decrypt(privateKey, message)

    fun complete() {
        keysExchanged = true
    }

    fun nextKeyExchangeMessage(current: KeyExchangeMessage): KeyExchangeMessage? {
        current.publicKey?.takeIf { it.isNotEmpty() }?.let { theirPublicKey = it }
        return when (current.type) {
            KeyExchangeMessageType.KEY_HANDSHAKE_START.name ->
                KeyExchangeMessage(KeyExchangeMessageType.KEY_HANDSHAKE_SYN.name, publicKey)
            KeyExchangeMessageType.KEY_HANDSHAKE_SYN.name ->
                KeyExchangeMessage(KeyExchangeMessageType.KEY_HANDSHAKE_SYNACK.name, publicKey)
            KeyExchangeMessageType.KEY_HANDSHAKE_SYNACK.name ->
                KeyExchangeMessage(KeyExchangeMessageType.KEY_HANDSHAKE_ACK.name, publicKey)
            else -> null
        }
    }
}
