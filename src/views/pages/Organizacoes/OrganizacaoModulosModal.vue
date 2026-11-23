<script setup>
import { organizacaoModulosApi } from '@/api/endpoints/organizacaoModulos';
import { useToast } from 'primevue/usetoast';
import { computed, onBeforeUnmount, ref, watch } from 'vue';

const props = defineProps({
  visible: { type: Boolean, required: true },
  organizacao: { type: Object, default: null },
});

const emit = defineEmits(['update:visible', 'salvo']);

const toast = useToast();

const loading = ref(false);
const salvando = ref(false);

/** @type {import('vue').Ref<Array>} catálogo com estado no tenant (fonte da verdade da UI) */
const modulos = ref([]);
/** @type {import('vue').Ref<Map<number, 'SIM'|'NAO'>>} estado original para diff */
const original = ref(new Map());

let debounceTimer = null;
const DEBOUNCE_MS = 400;

const visivel = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val),
});

function calcularDiff() {
  const diff = [];
  for (const m of modulos.value) {
    const originalAtivo = original.value.get(m.modulo_id);
    if (originalAtivo !== m.ativo_no_tenant) {
      diff.push({ modulo_id: m.modulo_id, ativo: m.ativo_no_tenant });
    }
  }
  return diff;
}

async function carregar() {
  if (!props.organizacao?.id) return;

  loading.value = true;
  try {
    const res = await organizacaoModulosApi.list(props.organizacao.id);
    modulos.value = res.data ?? [];
    original.value = new Map(modulos.value.map((m) => [m.modulo_id, m.ativo_no_tenant]));
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Erro',
      detail: err.message ?? 'Não foi possível carregar os módulos.',
      life: 4000,
    });
  } finally {
    loading.value = false;
  }
}

async function flush() {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }

  const diff = calcularDiff();
  if (diff.length === 0) return;

  salvando.value = true;
  try {
    const res = await organizacaoModulosApi.update(props.organizacao.id, diff);
    modulos.value = res.data ?? modulos.value;
    original.value = new Map(modulos.value.map((m) => [m.modulo_id, m.ativo_no_tenant]));
    emit('salvo');
  } catch (err) {
    await carregar();
    toast.add({
      severity: 'error',
      summary: 'Erro ao salvar',
      detail: err.message ?? 'Não foi possível salvar as alterações. Tente novamente.',
      life: 5000,
    });
  } finally {
    salvando.value = false;
  }
}

function toggle(modulo) {
  if (!modulo.pode_desativar) return;        // core: obrigatório
  if (modulo.ativo_global !== 'SIM') return; // módulo indisponível globalmente
  if (salvando.value) return;

  modulo.ativo_no_tenant = modulo.ativo_no_tenant === 'SIM' ? 'NAO' : 'SIM';

  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    flush();
  }, DEBOUNCE_MS);
}

/**
 * Texto do tooltip do ToggleSwitch, dependendo do estado do módulo.
 * @param {object} modulo
 * @returns {string}
 */
function tooltipToggle(modulo) {
  if (modulo.ativo_global !== 'SIM') {
    return 'Módulo não disponível (em desenvolvimento ou manutenção). Não pode ser concedido a tenants.';
  }
  if (!modulo.pode_desativar) {
    return 'O módulo core é obrigatório e não pode ser desativado.';
  }
  return 'Clique para ativar/desativar este módulo nesta organização.';
}

/**
 * Rótulo de disponibilidade (linguagem de negócio).
 * @param {object} modulo
 * @returns {'Disponível'|'Indisponível'}
 */
function labelDisponivel(modulo) {
  return modulo.ativo_global === 'SIM' ? 'Disponível' : 'Indisponível';
}

watch(
  () => props.visible,
  async (isOpen) => {
    if (isOpen && props.organizacao?.id) {
      await carregar();
    } else if (!isOpen) {
      await flush();
    }
  }
);

onBeforeUnmount(() => {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
    flush();
  }
});
</script>

<template>
  <Dialog
    v-model:visible="visivel"
    :header="organizacao ? `Módulos — ${organizacao.nome} (${organizacao.sigla})` : 'Módulos'"
    :style="{ width: '820px' }"
    modal
    class="p-fluid"
    :closable="!salvando"
  >
    <div v-if="loading" class="flex justify-center py-12">
      <ProgressSpinner style="width: 45px; height: 45px;" />
    </div>

    <div v-else>
      <p class="text-sm text-surface-500 mb-3">
        Ative os módulos que esta organização pode usar. Apenas módulos
        <strong>disponíveis</strong> podem ser concedidos. O módulo
        <span class="font-mono font-semibold">core</span> é obrigatório.
      </p>

      <DataTable
        :value="modulos"
        dataKey="modulo_id"
        responsiveLayout="scroll"
        size="small"
        :rowHover="true"
      >
        <template #empty>
          <div class="text-center py-8 text-surface-400 italic">
            Nenhum módulo cadastrado no catálogo global.
          </div>
        </template>

        <Column field="nome" header="Módulo" sortable style="width: 30%" />

        <Column field="codigo" header="Código" sortable style="width: 15%">
          <template #body="{ data }">
            <span class="font-mono text-xs font-semibold text-primary">{{ data.codigo }}</span>
          </template>
        </Column>

        <Column header="Disponível" style="width: 18%">
          <template #body="{ data }">
            <Tag
              :value="labelDisponivel(data)"
              :severity="data.ativo_global === 'SIM' ? 'success' : 'danger'"
              v-tooltip.top="
                data.ativo_global === 'SIM'
                  ? 'Módulo disponível para ser concedido a tenants.'
                  : 'Módulo em desenvolvimento ou manutenção. Não pode ser concedido.'
              "
            />
          </template>
        </Column>

        <Column header="Ativo no Tenant" style="width: 25%" class="text-center">
          <template #body="{ data }">
            <div class="flex items-center justify-center gap-2">
              <span
                class="text-xs font-bold"
                :class="data.ativo_no_tenant === 'SIM' ? 'text-green-600' : 'text-red-500'"
              >
                {{ data.ativo_no_tenant === 'SIM' ? 'SIM' : 'NÃO' }}
              </span>
              <ToggleSwitch
                :modelValue="data.ativo_no_tenant === 'SIM'"
                :disabled="!data.pode_desativar || data.ativo_global !== 'SIM' || salvando"
                @update:modelValue="() => toggle(data)"
                v-tooltip.top="tooltipToggle(data)"
              />
            </div>
          </template>
        </Column>
      </DataTable>

      <div v-if="salvando" class="flex items-center gap-2 mt-3 text-sm text-surface-500">
        <ProgressSpinner style="width: 16px; height: 16px;" />
        Salvando alterações...
      </div>
    </div>

    <template #footer>
      <Button
        label="Fechar"
        icon="pi pi-times"
        severity="secondary"
        @click="visivel = false"
        :disabled="salvando"
      />
    </template>
  </Dialog>
</template>