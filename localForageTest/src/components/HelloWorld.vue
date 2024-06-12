<script setup lang="ts">
// @ts-nocheck
import { ref, onMounted } from "vue";
import { IndexdDB } from "./index";
import { DB_STORE } from "./indexeddb_api";

// Define reactive data with explicit type
const items = ref<UserData[]>([]);
defineProps<{ msg: string }>();
let i = 1;

const storeName = "okicom";
const passphrase = "okicom123";

const jsonData1 = {
  data: [
    {
      id: 1,
      first_name: "John",
      last_name: "Doe",
      email: "john.doe@example.com",
      gender: "Male",
      ip_address: "127.0.0.1",
    },
    {
      id: 2,
      first_name: "Jane",
      last_name: "Smith",
      email: "jane.smith@example.com",
      gender: "Female",
      ip_address: "192.168.1.1",
    },
    {
      id: 3,
      first_name: "Alice",
      last_name: "Johnson",
      email: "alice.johnson@example.com",
      gender: "Female",
      ip_address: "10.0.0.1",
    },
    {
      id: 4,
      first_name: "Bob",
      last_name: "Brown",
      email: "bob.brown@example.com",
      gender: "Male",
      ip_address: "172.16.0.1",
    },
    {
      id: 5,
      first_name: "Emily",
      last_name: "Davis",
      email: "emily.davis@example.com",
      gender: "Female",
      ip_address: "192.168.0.2",
    },
    {
      id: 6,
      first_name: "Michael",
      last_name: "Wilson",
      email: "michael.wilson@example.com",
      gender: "Male",
      ip_address: "10.1.1.1",
    },
    {
      id: 7,
      first_name: "Sophia",
      last_name: "Martinez",
      email: "sophia.martinez@example.com",
      gender: "Female",
      ip_address: "192.168.2.1",
    },
    {
      id: 8,
      first_name: "William",
      last_name: "Taylor",
      email: "william.taylor@example.com",
      gender: "Male",
      ip_address: "172.16.0.2",
    },
    {
      id: 9,
      first_name: "Olivia",
      last_name: "Anderson",
      email: "olivia.anderson@example.com",
      gender: "Female",
      ip_address: "192.168.1.2",
    },
    {
      id: 10,
      first_name: "David",
      last_name: "Thomas",
      email: "david.thomas@example.com",
      gender: "Male",
      ip_address: "10.0.0.2",
    },
  ],
};

onMounted(async () => {});

const loadData = async () => {
  await IndexdDB.set(DB_STORE.USERS, "domainUser22", jsonData1);
};

const retrieveData = async () => {
  const key1 = sessionStorage.getItem("salt1");
  const key2 = sessionStorage.getItem("salt2");
  const key3 = sessionStorage.getItem("salt3");
  console.log("Key", key1, key2, key3);
  if (key1 && key2 && key3) {
    const data = await IndexdDB.get(DB_STORE.USERS, "domainUser22");
    console.log(data);
  } else {
    console.log("no key");
  }
};
</script>

<template>
  <h1>{{ msg }}</h1>

  <div class="card">
    <button type="button" @click="loadData()">Load Data to Index db</button>
    <button type="button" @click="retrieveData()">
      retrieve data from index db
    </button>
  </div>
</template>

<style scoped>
.read-the-docs {
  color: #888;
}
</style>
