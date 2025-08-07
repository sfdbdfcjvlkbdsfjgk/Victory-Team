import forge from 'node-forge';

const { pki } = forge;

const keypair = pki.rsa.generateKeyPair(2048);
const publicKeyPem = pki.publicKeyToPem(keypair.publicKey);
const privateKeyPem = pki.privateKeyToPem(keypair.privateKey);

export const getPublicKey = () => publicKeyPem;

export const decryptByPrivateKey = (encrypted: string) => {
  const privateKey = pki.privateKeyFromPem(privateKeyPem);
  const decrypted = privateKey.decrypt(forge.util.decode64(encrypted), 'RSA-OAEP');
  return decrypted;
};
