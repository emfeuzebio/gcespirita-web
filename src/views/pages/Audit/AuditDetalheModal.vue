<script setup>
import { useToast } from 'primevue/usetoast';
import { computed } from 'vue';

const TIMEZONE = 'America/Recife';

const props = defineProps({
  visible: { type: Boolean, default: false },
  registro: { type: Object, default: null },
});

const emit = defineEmits(['update:visible']);
const toast = useToast();

function fechar() {
  emit('update:visible', false);
}

function formatarData(valor) {
  if (!valor) return '-';
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return String(valor);
  return data.toLocaleString('pt-BR', { timeZone: TIMEZONE });
}

function formatarValor(valor) {
  if (valor === null || valor === undefined) return 'null';
  if (typeof valor === 'object') return JSON.stringify(valor);
  return String(valor);
}

function formatarEntidade(entidade) {
  if (!entidade) return '-';
  return String(entidade).replace(/^App\\Models\\/, '');
}

const nomeUsuario = computed(() => {
  const r = props.registro;
  if (!r) return '-';
  return r.usuario_nome ?? r.usuario?.nome ?? (r.usuario_id ? `Usuário #${r.usuario_id}` : 'Sistema');
});

const siglaOrganizacao = computed(() => {
  const r = props.registro;
  if (!r) return '-';
  return (
    r.organizacao_sigla ??
    r.organizacao?.sigla ??
    r.organizacao_nome ??
    r.organizacao?.nome ??
    (r.organizacao_id ? `Org #${r.organizacao_id}` : '-')
  );
});

const tooltipOrganizacao = computed(() => {
  const r = props.registro;
  if (!r) return '';
  const nome = r.organizacao_nome ?? r.organizacao?.nome;
  const id = r.organizacao_id ? `ID: ${r.organizacao_id}` : '';
  return [nome, id].filter(Boolean).join(' • ');
});

const linhasDiff = computed(() => {
  const antigos = props.registro?.dados_antigos ?? {};
  const novos = props.registro?.dados_novos ?? {};
  const chaves = Array.from(new Set([...Object.keys(antigos), ...Object.keys(novos)]));

  return chaves.map((campo) => {
    const temAntigo = Object.prototype.hasOwnProperty.call(antigos, campo);
    const temNovo = Object.prototype.hasOwnProperty.call(novos, campo);
    const valAntigo = temAntigo ? antigos[campo] : undefined;
    const valNovo = temNovo ? novos[campo] : undefined;

    const alterado = temAntigo && temNovo
      ? JSON.stringify(valAntigo) !== JSON.stringify(valNovo)
      : temNovo !== temAntigo;

    return {
      campo,
      antigo: temAntigo ? formatarValor(valAntigo) : '-',
      novo: temNovo ? formatarValor(valNovo) : '-',
      alterado,
    };
  });
});

async function copiarJson() {
  if (!props.registro) return;
  try {
    await navigator.clipboard.writeText(JSON.stringify(props.registro, null, 2));
    toast.add({
      severity: 'success',
      summary: 'Copiado',
      detail: 'JSON copiado para a área de transferência.',
      life: 2500,
    });
  } catch {
    toast.add({
      severity: 'warn',
      summary: 'Aviso',
      detail: 'Não foi possível copiar automaticamente.',
      life: 2500,
    });
  }
}
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="emit('update:visible', $event)"
    :header="registro ? `Detalhes da Auditoria #${registro.id}` : 'Detalhes da Auditoria'"
    :modal="true"
    :style="{ width: '800px' }"
    @hide="fechar"
  >
    <div v-if="registro" class="flex flex-col gap-4">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <div>
          <span class="text-surface-500 block">Ação</span>
          <span class="font-semibold uppercase">{{ registro.acao ?? '-' }}</span>
        </div>

        <div>
          <span class="text-surface-500 block">Usuário</span>
          <span
            class="font-semibold"
            v-tooltip.top="registro.usuario_id ? `ID: ${registro.usuario_id}` : ''"
          >
            {{ nomeUsuario }}
          </span>
        </div>

        <div>
          <span class="text-surface-500 block">Organização</span>
          <span
            class="font-semibold"
            v-tooltip.top="tooltipOrganizacao"
          >
            {{ siglaOrganizacao }}
          </span>
        </div>

        <div>
          <span class="text-surface-500 block">Registro ID</span>
          <span class="font-semibold">{{ registro.registro_id ?? '-' }}</span>
        </div>

        <div class="col-span-2">
          <span class="text-surface-500 block">Entidade</span>
          <span class="font-semibold" v-tooltip.top="registro.entidade">
            {{ formatarEntidade(registro.entidade) }}
          </span>
        </div>

        <div>
          <span class="text-surface-500 block">IP</span>
          <span class="font-mono text-xs">{{ registro.ip ?? '-' }}</span>
        </div>

        <div>
          <span class="text-surface-500 block">Data/Hora (UTC-3)</span>
          <span>{{ formatarData(registro.created_at) }}</span>
        </div>
      </div>

      <div>
        <span class="text-surface-500 text-sm block mb-1">User-Agent</span>
        <div class="p-2 rounded bg-surface-100 dark:bg-surface-800 font-mono text-xs break-all">
          {{ registro.user_agent ?? '-' }}
        </div>
      </div>

      <div v-if="linhasDiff.length > 0">
        <span class="text-sm font-medium block mb-2">Campos / Alterações</span>
        <DataTable :value="linhasDiff" size="small" stripedRows responsiveLayout="scroll">
          <Column field="campo" header="Campo" style="width: 12rem">
            <template #body="{ data }">
              <span class="font-mono text-xs font-semibold">{{ data.campo }}</span>
            </template>
          </Column>

          <Column field="antigo" header="Antes">
            <template #body="{ data }">
              <span class="font-mono text-xs break-all text-red-500">{{ data.antigo }}</span>
            </template>
          </Column>

          <Column field="novo" header="Depois">
            <template #body="{ data }">
              <span
                class="font-mono text-xs break-all px-1.5 py-0.5 rounded"
                :class="data.alterado ? 'font-semibold bg-primary/15 text-primary' : ''"
              >
                {{ data.novo }}
              </span>
            </template>
          </Column>
        </DataTable>
      </div>

      <div v-else class="text-sm text-muted-color italic">
        Nenhum payload de dados registrado para esta ação.
      </div>
    </div>

    <template #footer>
      <Button label="Copiar JSON" icon="pi pi-copy" severity="secondary" outlined @click="copiarJson" />
      <Button label="Fechar" icon="pi pi-times" severity="secondary" @click="fechar" />
    </template>
  </Dialog>
</template>