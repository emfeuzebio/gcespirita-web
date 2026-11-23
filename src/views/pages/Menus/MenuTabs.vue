<script setup>
import MenuPermissoesTreeView from './MenuPermissoesTreeView.vue';
import MenuTreeView from './MenuTreeView.vue';
</script>

<template>
  <TabView>
    <TabPanel header="Menu Geral">
      <MenuTreeView />
    </TabPanel>

    <TabPanel header="Menus por Perfil">
      <MenuPermissoesTreeView />
    </TabPanel>
  </TabView>
</template>