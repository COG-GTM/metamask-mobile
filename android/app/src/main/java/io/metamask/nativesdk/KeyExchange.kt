package io.metamask.nativesdk

import com.crypto.ecies.Ecies

enum class KeyExchangeMessageType {
  KEY_HANDSHAKE_START,
  KEY_HANDSHAKE_CHECK,
  KEY_HANDSHAKE_SYN,
  KEY_HANDSHAKE_SYNACK,
  KEY_HANDSHAKE_ACK,
}

data class KeyExchangeMessage(val type: String, val publicKey: String?)

/** ECIES key exchange state for a single native dapp connection. */
class KeyExchange {
  private val ecies = Ecies()
  private val privateKey: String = ecies.privateKey()
  val publicKey: String = ecies.publicKeyFrom(privateKey)
  private var theirPublicKey: String? = null
  private var isKeysExchanged = false

  @Synchronized
  fun keysExchanged(): Boolean = isKeysExchanged

  @Synchronized
  fun complete() {
    isKeysExchanged = true
  }

  @Synchronized
  fun encrypt(message: String): String {
    val key = theirPublicKey ?: throw IllegalStateException("theirPublicKey is null")
    return ecies.encrypt(key, message)
  }

  fun decrypt(message: String): String = ecies.decrypt(privateKey, message)

  @Synchronized
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
