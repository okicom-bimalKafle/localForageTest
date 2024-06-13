import { defineStore } from "pinia";
import { ref } from "vue";
import SecureLs from "secure-ls";

export const usePiniaStore = defineStore("myStore", () => {
  const salt1 = ref<Uint8Array>();
  const salt2 = ref<Uint8Array>();
  const salt3 = ref<Uint32Array>();
  const ls = ref(new SecureLs());

  async function setSalt1(salt: Uint8Array): Promise<void> {
    salt1.value = salt;
    ls.value.set("salt1", uint8ArrayToBase64(salt));
  }

  async function setSalt2(salt: Uint8Array): Promise<void> {
    salt2.value = salt;
    ls.value.set("salt2", uint8ArrayToBase64(salt));
  }

  async function setSalt3(salt: Uint32Array): Promise<void> {
    salt3.value = salt;
    ls.value.set("salt3", uint32ArrayToBase64(salt));
  }
  async function getSalt1(): Promise<Uint8Array> {
    const storedSalt = ls.value.get("salt1");
    return storedSalt ? base64ToUint8Array(storedSalt) : new Uint8Array();
  }

  async function getSalt2(): Promise<Uint8Array> {
    const storedSalt = ls.value.get("salt2");
    return storedSalt ? base64ToUint8Array(storedSalt) : new Uint8Array();
  }

  async function getSalt3(): Promise<Uint32Array> {
    const storedSalt = ls.value.get("salt3");
    return storedSalt ? base64ToUint32Array(storedSalt) : new Uint32Array();
  }
  const uint8ArrayToBase64 = (uint8Array: Uint8Array): string => {
    let binaryString = "";
    const len = uint8Array.byteLength;
    for (let i = 0; i < len; i++) {
      binaryString += String.fromCharCode(uint8Array[i]);
    }
    return window.btoa(binaryString);
  };

  const base64ToUint8Array = (base64: string): Uint8Array => {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const uint8Array = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      uint8Array[i] = binaryString.charCodeAt(i);
    }
    return uint8Array;
  };

  const uint32ArrayToBase64 = (uint32Array: Uint32Array): string => {
    let binaryString = "";
    const len = uint32Array.length;
    for (let i = 0; i < len; i++) {
      const bytes = new Uint8Array(Uint32Array.of(uint32Array[i]).buffer);
      for (let j = 0; j < bytes.length; j++) {
        binaryString += String.fromCharCode(bytes[j]);
      }
    }
    return window.btoa(binaryString);
  };

  const base64ToUint32Array = (base64: string): Uint32Array => {
    const binaryString = window.atob(base64);
    const len = binaryString.length / 4;
    const uint32Array = new Uint32Array(len);
    for (let i = 0; i < len; i++) {
      const bytes = [
        binaryString.charCodeAt(i * 4),
        binaryString.charCodeAt(i * 4 + 1),
        binaryString.charCodeAt(i * 4 + 2),
        binaryString.charCodeAt(i * 4 + 3),
      ];
      uint32Array[i] = new Uint32Array(new Uint8Array(bytes).buffer)[0];
    }
    return uint32Array;
  };

  return {
    setSalt1,
    setSalt2,
    setSalt3,
    getSalt1,
    getSalt2,
    getSalt3,
  };
});
