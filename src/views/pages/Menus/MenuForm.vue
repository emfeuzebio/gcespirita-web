<script setup>
import { menusApi } from '@/api/endpoints/menus';
import { modulosApi } from '@/api/endpoints/modulos';
import { ICONES_OPTIONS, faToPi } from '@/utils/faToPi';
import { useToast } from 'primevue/usetoast';
import { computed, ref, watch } from 'vue';

const props = defineProps({
  visible: { type: Boolean, default: false },
  menu: { type: Object, default: null },
  arvore: { type: Array, default: () => [] },
});
const emit = defineEmits(['update:visible', 'salvo']);

const toast = useToast();

const form = ref(camposVazios());
const errors = ref({});
const saving = ref(false);
const modulos = ref([]);
const modulosLoaded = ref(false);

function camposVazios() {
  return {
    titulo: '',
    tipo: 'item',
    modulo_id: null,
    parent_id: null,
    icone: null,
    rota: '',
    ordem: 0,
    ativo: 'SIM',
  };
}

const isEdicao = computed(() => !!props.menu?.id);

/** Achata a árvore em lista, excluindo um id (e, por consequência, seus descendentes). */
function flatten(nos, excludeId = null, out = []) {
  for (const n of nos ?? []) {
    if (n.id === excludeId) continue;
    out.push({ id: n.id, titulo: n.titulo });
    if (n.children?.length) flatten(n.children, excludeId, out);
  }
  return out;
}

const opcoesPai = computed(() => [
  { id: null, titulo: '— Nenhum (raiz) —' },
  ...flatten(props.arvore, props.menu?.id ?? null),
]);

watch(
  () => props.visible,
  async (v) => {
    if (!v) return;

    form.value = props.menu
      ? {
          titulo: props.menu.titulo ?? '',
          tipo: props.menu.tipo ?? 'item',
          modulo_id: props.menu.modulo_id ?? null,
          parent_id: props.menu.parent_id ?? null,
          icone: faToPi(props.menu.icone),
          rota: props.menu.rota ?? '',
          ordem: props.menu.ordem ?? 0,
          ativo: props.menu.ativo ?? 'SIM',
        }
      : camposVazios();

    errors.value = {};

    if (!modulosLoaded.value) {
      try {
        const res = await modulosApi.list();
        modulos.value = res.data ?? [];
        modulosLoaded.value = true;
      } catch (err) {
        toast.add({ severity: 'error', summary: 'Erro', detail: err.message, life: 4000 });
      }
    }
  }
);

function close() {
  emit('update:visible', false);
}

async function salvar() {
  saving.value = true;
  errors.value = {};

  const payload = { ...form.value };
  if (!payload.rota) payload.rota = null;
  if (!payload.icone) payload.icone = null;

  try {
    if (isEdicao.value) {
      await menusApi.update(props.menu.id, payload);
      toast.add({ severity: 'success', summary: 'Atualizado', detail: 'Menu atualizado.', life: 3000 });
    } else {
      await menusApi.create(payload);
      toast.add({ severity: 'success', summary: 'Criado', detail: 'Menu criado.', life: 3000 });
    }
    emit('salvo');
  } catch (err) {
    errors.value = err.errors || {};
    if (err.status === 422) {
      toast.add({ severity: 'warn', summary: 'Verifique os campos', detail: err.message, life: 4000 });
    } else {
      toast.add({ severity: 'error', summary: 'Erro', detail: err.message, life: 5000 });
    }
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="emit('update:visible', $event)"
    :header="isEdicao ? 'Editar menu' : 'Novo menu'"
    :modal="true"
    :style="{ width: '600px' }"
    @hide="close"
  >
    <div class="flex flex-col gap-4">
      <div>
        <label class="block text-sm font-medium mb-2">Título *</label>
        <InputText v-model="form.titulo" class="w-full" :invalid="!!errors.titulo" maxlength="255" autofocus />
        <small v-if="errors.titulo" class="text-red-500 block mt-1">{{ errors.titulo.join(' ') }}</small>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium mb-2">Tipo *</label>
          <Select v-model="form.tipo" :options="['item', 'separador', 'grupo']" class="w-full" :invalid="!!errors.tipo" />
          <small v-if="errors.tipo" class="text-red-500 block mt-1">{{ errors.tipo.join(' ') }}</small>
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">Módulo *</label>
          <Select
            v-model="form.modulo_id"
            :options="modulos"
            optionLabel="nome"
            optionValue="id"
            placeholder="Selecione"
            class="w-full"
            :invalid="!!errors.modulo_id"
          />
          <small v-if="errors.modulo_id" class="text-red-500 block mt-1">{{ errors.modulo_id.join(' ') }}</small>
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium mb-2">Menu pai</label>
        <Select
          v-model="form.parent_id"
          :options="opcoesPai"
          optionLabel="titulo"
          optionValue="id"
          placeholder="— Nenhum (raiz) —"
          class="w-full"
          :invalid="!!errors.parent_id"
        />
        <small v-if="errors.parent_id" class="text-red-500 block mt-1">{{ errors.parent_id.join(' ') }}</small>
      </div>

      <div>
        <label class="block text-sm font-medium mb-2">Ícone</label>
        <Select
          v-model="form.icone"
          :options="ICONES_OPTIONS"
          optionLabel="label"
          optionValue="value"
          placeholder="Selecione um ícone"
          class="w-full"
          filter
          :invalid="!!errors.icone"
        >
          <template #option="slotProps">
            <span class="inline-flex items-center gap-2">
              <i :class="slotProps.option.value"></i>
              <span>{{ slotProps.option.label }}</span>
            </span>
          </template>
          <template #value="slotProps">
            <span v-if="slotProps.value" class="inline-flex items-center gap-2">
              <i :class="slotProps.value"></i>
              <span>{{ ICONES_OPTIONS.find((o) => o.value === slotProps.value)?.label }}</span>
            </span>
            <span v-else class="text-muted-color">{{ slotProps.placeholder }}</span>
          </template>
        </Select>
        <small v-if="errors.icone" class="text-red-500 block mt-1">{{ errors.icone.join(' ') }}</small>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium mb-2">Rota</label>
          <InputText v-model="form.rota" class="w-full" placeholder="/caminho ou https://..." :invalid="!!errors.rota" />
          <small v-if="errors.rota" class="text-red-500 block mt-1">{{ errors.rota.join(' ') }}</small>
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">Ordem</label>
          <InputNumber v-model="form.ordem" class="w-full" :min="0" :invalid="!!errors.ordem" />
          <small v-if="errors.ordem" class="text-red-500 block mt-1">{{ errors.ordem.join(' ') }}</small>
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium mb-2">Ativo</label>
        <Select v-model="form.ativo" :options="['SIM', 'NAO']" class="w-full" :invalid="!!errors.ativo" />
        <small v-if="errors.ativo" class="text-red-500 block mt-1">{{ errors.ativo.join(' ') }}</small>
      </div>
    </div>

    <template #footer>
      <Button label="Cancelar" severity="secondary" text @click="close" :disabled="saving" />
      <Button label="Salvar" icon="pi pi-check" @click="salvar" :loading="saving" />
    </template>
  </Dialog>
</template>