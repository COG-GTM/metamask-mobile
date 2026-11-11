package io.metamask.nativesdk

import android.annotation.SuppressLint
import android.content.Context
import android.content.SharedPreferences
import android.content.pm.PackageManager
import android.content.pm.Signature
import android.os.Build
import org.json.JSONObject
import java.security.MessageDigest

internal object CallerIdentity {
  /**
   * Stable identity for a Binder caller: the packages sharing its UID and the SHA-256 digests of
   * their signing certificates. Returns null when the caller cannot be resolved.
   */
  fun of(context: Context, uid: Int): String? {
    val pm = context.packageManager
    val packages = pm.getPackagesForUid(uid)?.sorted().orEmpty()
    if (packages.isEmpty()) {
      return null
    }
    val signers = sortedSetOf<String>()
    for (pkg in packages) {
      val digests = signingCertificateDigests(pm, pkg)
      if (digests.isEmpty()) {
        return null
      }
      signers.addAll(digests)
    }
    return "packages=${packages.joinToString(",")};signers=${signers.joinToString(",")}"
  }

  @SuppressLint("PackageManagerGetSignatures")
  private fun signingCertificateDigests(pm: PackageManager, pkg: String): List<String> {
    val signatures: Array<Signature>? = try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
        pm.getPackageInfo(pkg, PackageManager.GET_SIGNING_CERTIFICATES).signingInfo?.apkContentsSigners
      } else {
        @Suppress("DEPRECATION")
        pm.getPackageInfo(pkg, PackageManager.GET_SIGNATURES).signatures
      }
    } catch (e: PackageManager.NameNotFoundException) {
      null
    }
    return signatures.orEmpty().map { sha256(it.toByteArray()) }
  }

  private fun sha256(bytes: ByteArray): String =
    MessageDigest.getInstance("SHA-256").digest(bytes).joinToString("") { "%02x".format(it) }
}

internal class SharedPreferencesSessionOwnerStore(context: Context) : SessionOwnerStore {
  private val prefs: SharedPreferences =
    context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

  override fun get(sessionId: String): SessionOwner? = prefs.getString(sessionId, null)?.let(::decode)

  override fun all(): Map<String, SessionOwner> =
    prefs.all.mapNotNull { (key, value) -> (value as? String)?.let(::decode)?.let { key to it } }.toMap()

  override fun put(sessionId: String, owner: SessionOwner) {
    val json = JSONObject().put(IDENTITY, owner.identity).put(BOUND_AT, owner.boundAt)
    prefs.edit().putString(sessionId, json.toString()).apply()
  }

  override fun remove(sessionId: String) {
    prefs.edit().remove(sessionId).apply()
  }

  private fun decode(raw: String): SessionOwner? = try {
    val json = JSONObject(raw)
    SessionOwner(json.getString(IDENTITY), json.getLong(BOUND_AT))
  } catch (e: Exception) {
    null
  }

  private companion object {
    const val PREFS_NAME = "io.metamask.nativesdk.session_owners"
    const val IDENTITY = "identity"
    const val BOUND_AT = "boundAt"
  }
}
