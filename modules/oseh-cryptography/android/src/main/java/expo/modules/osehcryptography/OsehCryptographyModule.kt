package expo.modules.osehcryptography

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

import javax.crypto.Cipher;

import java.security.KeyPairGenerator
import java.security.interfaces.RSAPrivateKey
import java.security.interfaces.RSAPublicKey
import java.security.KeyFactory
import java.security.spec.PKCS8EncodedKeySpec

import java.math.BigInteger

import java.util.Base64

class OsehCryptographyModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("OsehCryptography")

    AsyncFunction("generateRSA4096V1KeyPair") {
      val keyPairGenerator = KeyPairGenerator.getInstance("RSA")
      keyPairGenerator.initialize(4096)
      val keyPair = keyPairGenerator.generateKeyPair()
      val privateKey = keyPair.getPrivate() as RSAPrivateKey
      val privateExponent = privateKey.getPrivateExponent()
      val modulus = privateKey.getModulus()

      val publicKey = keyPair.getPublic() as RSAPublicKey
      val publicExponent = publicKey.getPublicExponent()

      if (publicExponent != BigInteger.valueOf(65537)) {
        throw Exception("Public exponent is not 65537")
      }

      val encoder = Base64.getEncoder();

      var modulusByteArray = modulus.toByteArray()
      // if the modulus is 513 bytes it's because it was stored as a signed number
      // and the first byte should be zero
      if (modulusByteArray.size == 513) {
        if (modulusByteArray[0] != 0.toByte()) {
          throw Exception("Unexpected first byte in modulus")
        }
        modulusByteArray = modulusByteArray.sliceArray(1 until modulusByteArray.size)
      }

      val modulusB64 = encoder.encodeToString(modulusByteArray)

      // a similar thing might happen with the private exponent, but since that size isn't
      // fixed anyway that's fine
      val privateExponentB64 = encoder.encodeToString(privateExponent.toByteArray())

      // now we're going to get the standard encoding for the private key
      // as encode that in b64, so that we can decrypt more efficiently
      val privateKeyB64 = encoder.encodeToString(privateKey.getEncoded())

      return@AsyncFunction mapOf(
        "modulus" to modulusB64,
        "privateExponent" to privateExponentB64,
        "hwAccelInfo" to privateKeyB64
      )
    }

    AsyncFunction("decryptRSA4096V1") { hwAccelInfo: String, encryptedB64: String ->
      // first -> b64 to bytes
      val decoder = Base64.getDecoder()
      val privateKeyEncoded = decoder.decode(hwAccelInfo)
      val encryptedBytes = decoder.decode(encryptedB64)

      // privateKeyEncoded -> RSAPrivateKey
      val keyFactory = KeyFactory.getInstance("RSA")
      val keySpec = PKCS8EncodedKeySpec(privateKeyEncoded)
      val privateKey = keyFactory.generatePrivate(keySpec) as RSAPrivateKey

      // decrypt
      val cipher = Cipher.getInstance("RSA/ECB/OAEPWithSHA-512AndMGF1Padding")
      cipher.init(Cipher.DECRYPT_MODE, privateKey)
      val decryptedBytes = cipher.doFinal(encryptedBytes)

      val decryptedB64 = Base64.getEncoder().encodeToString(decryptedBytes)
      return@AsyncFunction decryptedB64
    }
  }
}
