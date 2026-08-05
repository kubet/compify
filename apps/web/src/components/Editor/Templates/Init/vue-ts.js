const vueTsInit = (name) => ({
  [`/src/${name}.vue`]: {
    code: `<template>
  <div>
    <h1 class="title">Hello {{ name }}</h1>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  name: string
}>(), {
  name: '${name}'
})
</script>

<style scoped>
.title {
  color: white;
}
</style>`,
    main: true
  }
});

export default vueTsInit;
