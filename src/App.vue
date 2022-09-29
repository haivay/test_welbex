<script setup>
import Table from './components/Table.vue'
</script>

<template>
  <div class="lg:container lg:w-3/4 md:my-10">
    <Table 
      tableName="orders"
      :columnsCount="4"
      :headers="['Дата', 'Название', 'Количество', 'Расстояние']"
      :pageRows="10"
    />
  </div>
</template>