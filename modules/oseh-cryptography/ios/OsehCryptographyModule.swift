import ExpoModulesCore


public class OsehCryptographyModule: Module {
  public func definition() -> ModuleDefinition {
    Name("OsehCryptography")
    AsyncFunction("generateRSA4096V1KeyPair") { () in
      // below: generates a rsa key with SecKeyCreateRandomKey
      // and returns the public and private key as a dictionary

      let attributes: [String: Any] =
          [kSecAttrKeyType as String:            kSecAttrKeyTypeRSA,
          kSecAttrKeySizeInBits as String:      4096
      ]
      var error: Unmanaged<CFError>?
      guard let privateKey = SecKeyCreateRandomKey(attributes as CFDictionary, &error) else {
          throw error!.takeRetainedValue() as Error
      }
      guard let privateData = SecKeyCopyExternalRepresentation(privateKey, &error) else {
          throw error!.takeRetainedValue() as Error
      }

      // first byte should be 30
      let privateDataBytes = [UInt8](privateData as Data)
      let firstByte = privateDataBytes[0]
      if firstByte != 0x30 {
          throw NSError(domain: "OsehCryptography", code: 1, userInfo: ["message": "Invalid private key data"])
      }

      // we need the modulus, publicExponent, and privateExponent
      
      // modulus has offset 7, meaning the int marker sequence 0x0282 should be
      // at index 7

      let modulusMarkerByte = privateDataBytes[7..<9]
      if modulusMarkerByte != [0x02, 0x82] {
          throw NSError(domain: "OsehCryptography", code: 2, userInfo: ["message": "Invalid modulus marker bytes"])
      }

      // the two bytes after the marker are the length of the modulus; 513 bytes
      // because its 512 unsigned bytes, but needs a sign bit, so uses a 0x00 byte
      // for the sign marker

      let modulusLength = Int(privateDataBytes[9]) << 8 + Int(privateDataBytes[10])
      if modulusLength != 513 {
          throw NSError(domain: "OsehCryptography", code: 3, userInfo: ["message": "Invalid modulus length"])
      }

      // verify the 0x00 byte
      if privateDataBytes[11] != 0x00 {
          throw NSError(domain: "OsehCryptography", code: 4, userInfo: ["message": "Modulus sign byte is not 0x00"])
      }


      let realModulusBytes = privateDataBytes[12..<12 + 512]

      // publicExponent starts at byte 524 with the 0x02, then the length in bytes which should be 0x03,
      // followed by the bytes for 65537 (0x010001)
      let publicExponentMarkerByte = privateDataBytes[524]
      if publicExponentMarkerByte != 0x02 {
          throw NSError(domain: "OsehCryptography", code: 5, userInfo: ["message": "Invalid public exponent marker byte"])
      }
      let publicExponentLength = privateDataBytes[525]
      if publicExponentLength != 0x03 {
          throw NSError(domain: "OsehCryptography", code: 6, userInfo: ["message": "Invalid public exponent length"])
      }
      let publicExponentBytes = privateDataBytes[526..<529]
      if publicExponentBytes != [0x01, 0x00, 0x01] {
          throw NSError(domain: "OsehCryptography", code: 7, userInfo: ["message": "Invalid public exponent bytes"])
      }

      // privateExponent starts at byte 529 with 0x0282 followed by the length which may vary
      // but should generally be around 512 bytes (at least 500, no more than 513)
      let privateExponentMarkerByte = privateDataBytes[529..<531]
      if privateExponentMarkerByte != [0x02, 0x82] {
          throw NSError(domain: "OsehCryptography", code: 8, userInfo: ["message": "Invalid private exponent marker bytes"])
      }

      var privateExponentLength = Int(privateDataBytes[531]) << 8 + Int(privateDataBytes[532])
      if privateExponentLength < 500 || privateExponentLength > 513 {
          throw NSError(domain: "OsehCryptography", code: 9, userInfo: ["message": "Invalid private exponent length"])
      }

      var privateExponentStart = 533

      // if it's 513 bytes, the first byte should be 0x00 and will be skipped (its just for a sign bit)
      if privateExponentLength == 513 {
        if privateDataBytes[privateExponentStart] != 0x00 {
          throw NSError(domain: "OsehCryptography", code: 10, userInfo: ["message": "Invalid private exponent bytes"])
        }
        privateExponentStart += 1
        privateExponentLength -= 1
      }

      let realPrivateExponentBytes = privateDataBytes[privateExponentStart..<privateExponentStart + privateExponentLength]

      let modulus = Data(realModulusBytes).base64EncodedString()
      let privateExponent = Data(realPrivateExponentBytes).base64EncodedString()

      // finally, although extracting the modulus/privateExponent is convenient for
      // ensuring the key can definitely be recovered in a cross-platform way, it'll
      // be much faster to decrypt with the actual private key in the normal format

      let hwAccelInfo = (privateData as Data).base64EncodedString()

      return ["modulus": modulus, "privateExponent": privateExponent, "hwAccelInfo": hwAccelInfo]
    }
    AsyncFunction("decryptRSA4096V1") { (hwAccelInfo: String, encryptedB64: String) in 
        // decrypts the encrypted data with the private key
        // and returns the decrypted data as a base64 string

        // first - get the Data objects that are represented
        guard let encryptedData = Data(base64Encoded: encryptedB64) else {
            throw NSError(domain: "OsehCryptography", code: 1, userInfo: ["message": "Invalid base64 encrypted data"])
        }
        guard let hwAccelData = Data(base64Encoded: hwAccelInfo) else {
            throw NSError(domain: "OsehCryptography", code: 2, userInfo: ["message": "Invalid base64 hwAccelInfo data"])
        }
    
        // then, we need to convert the hwAccelData to a SecKey object
        var error: Unmanaged<CFError>?
        guard let privateKey = SecKeyCreateWithData(hwAccelData as CFData, [
            kSecAttrKeyType as String: kSecAttrKeyTypeRSA,
            kSecAttrKeyClass as String: kSecAttrKeyClassPrivate,
            kSecAttrKeySizeInBits as String: 4096
        ] as CFDictionary, &error) else {
            throw error!.takeRetainedValue() as Error
        }
    
        // then, we need to decrypt the data with the private key
        // using SecKeyCreateDecryptedData
        guard let decryptedData = SecKeyCreateDecryptedData(privateKey, .rsaEncryptionOAEPSHA512, encryptedData as CFData, &error) else {
            throw error!.takeRetainedValue() as Error
        }
    
        // finally, we need to convert the decrypted data to a base64 string
        return (decryptedData as Data).base64EncodedString()
    }
  }
}
