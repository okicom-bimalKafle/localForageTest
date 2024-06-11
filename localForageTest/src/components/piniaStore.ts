import { defineStore } from "pinia";

interface State {
  salt1: Uint8Array;
  salt2: Uint8Array;
  salt3: Uint32Array;
  // Define other state properties with their types...
}

export const usePiniaStore = defineStore({
  id: "myStore",
  state: (): State => ({
    salt1: new Uint8Array(),
    salt2: new Uint8Array(),
    salt3: new Uint32Array(),
    // Initialize other state properties...
  }),
  actions: {
    async setSalt1(salt: Uint8Array): Promise<void> {
      this.salt1 = salt;
    },
    async setSalt2(salt: Uint8Array): Promise<void> {
      this.salt2 = salt;
    },
    async setSalt3(salt: Uint32Array): Promise<void> {
      this.salt3 = salt;
    },
  },
});
