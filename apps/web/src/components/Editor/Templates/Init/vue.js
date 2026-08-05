const vueInit = (name) => ({
  [`/src/${name}.vue`]: {
    code: `<template>
  <div>
    <h1 class="title">Hello {{ name }}</h1>
  </div>
</template>

<script>
export default {
  name: '${name}',
  props: {
    name: {
      type: String,
      required: true,
      default: '${name}'
    }
  }
}
</script>

<style scoped>
.title {
  color: white;
}
</style>`,
    main: true
  }
});

export default vueInit;