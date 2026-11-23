<script setup>
import { perfisApi } from '@/api/endpoints/perfis';
import { useToast } from 'primevue/usetoast';
import { computed, ref, watch } from 'vue';

const props = defineProps({
  visible: { type: Boolean, required: true },
  perfil: { type: Object, default: null },
  entidadeFocadaInicial: { type: Object, default: null },
});

const emit = defineEmits(['update:visible', 'hide', 'salvo']);

const toast = useToast();
const loading = ref(false);
const salvandoId = ref(null);

const estruturas = ref([]); 
const entidadeSelecionada = ref(null); 
const buscaTexto = ref(''); 

const visivel = computed({
  get: () => props.visible,
  set: (val) => {
    emit('update:visible', val);
    if (!val) {
      emit('hide');
      emit('salvo');
    }
  }
});

// Opções para o Dropdown de Filtro de Entidades usando 'descricao'
const entidadesOptions = computed(() => {
  return estruturas.value.map(e => ({
    id: e.id,
    descricao: e.descricao
  }));
});

// Ações filtradas por entidade E por texto de pesquisa
const acoesFiltradas = computed(() => {
  let lista = [];

  const ents = entidadeSelecionada.value 
    ? estruturas.value.filter(e => e.id === entidadeSelecionada.value.id)
    : estruturas.value;

  ents.forEach(entidade => {
    if (entidade.acoes && Array.isArray(entidade.acoes)) {
      entidade.acoes.forEach(acao => {
        lista.push({
          entidadeId: entidade.id,
          entidadeDescricao: entidade.descricao,
          ...acao
        });
      });
    }
  });

  if (buscaTexto.value && buscaTexto.value.trim() !== '') {
    const termo = buscaTexto.value.toLowerCase().trim();
    lista = lista.filter(item => 
      (item.acao && item.acao.toLowerCase().includes(termo)) ||
      (item.rota && item.rota.toLowerCase().includes(termo)) ||
      (item.nomeAmigavel && item.nomeAmigavel.toLowerCase().includes(termo)) ||
      (item.nome_amigavel && item.nome_amigavel.toLowerCase().includes(termo)) ||
      (item.entidadeDescricao && item.entidadeDescricao.toLowerCase().includes(termo))
    );
  }

  return lista;
});

watch(
  () => props.visible,
  async (isOpen) => {
    if (isOpen && props.perfil) {
      entidadeSelecionada.value = props.entidadeFocadaInicial || null;
      buscaTexto.value = '';
      await carregarDados();
    }
  }
);

async function carregarDados() {
  loading.value = true;
  try {
    const res = await perfisApi.carregarAutorizacoes(props.perfil.id);
    const data = res.data ?? res;
    estruturas.value = data.estruturas ?? [];
  } catch (err) {
    console.error(err);
    toast.add({ severity: 'error', summary: 'Erro', detail: 'Não foi possível carregar as autorizações do perfil.', life: 4000 });
  } finally {
    loading.value = false;
  }
}

async function alterarAutorizacao(acaoId, ativoAtual) {
  const novoStatus = ativoAtual === 'SIM' ? 'NAO' : 'SIM';
  salvandoId.value = acaoId;

  atualizarEstadoLocal(acaoId, novoStatus);

  try {
    await perfisApi.atualizarAutorizacao(props.perfil.id, acaoId, novoStatus);
    toast.add({ severity: 'success', summary: 'Atualizado', detail: 'Permissão salva com sucesso.', life: 1500 });
  } catch (err) {
    atualizarEstadoLocal(acaoId, ativoAtual);
    toast.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao salvar alteração de permissão.', life: 3000 });
  } finally {
    salvandoId.value = null;
  }
}

function atualizarEstadoLocal(acaoId, novoStatus) {
  estruturas.value.forEach(entidade => {
    entidade.acoes.forEach(acao => {
      if (acao.id === acaoId) {
        acao.ativo = novoStatus;
      }
    });
  });
}

async function definirEmMassa(statusDesejado) {
  const acoesAlvo = acoesFiltradas.value;
  if (acoesAlvo.length === 0) return;

  loading.value = true;
  try {
    await Promise.all(
      acoesAlvo.map(acao => 
        perfisApi.atualizarAutorizacao(props.perfil.id, acao.id, statusDesejado)
      )
    );

    acoesAlvo.forEach(acao => atualizarEstadoLocal(acao.id, statusDesejado));

    toast.add({ 
      severity: 'success', 
      summary: 'Sucesso', 
      detail: `Permissões atualizadas para ${statusDesejado}.`, 
      life: 3000 
    });
  } catch (err) {
    toast.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao aplicar alterações em massa.', life: 3000 });
    await carregarDados();
  } finally {
    loading.value = false;
  }
}

function fechar() {
  visivel.value = false;
}
</script>

<template>
  <Dialog 
    v-model:visible="visivel" 
    :header="perfil ? `Gerenciar Autorizações: ${perfil.sigla} - ${perfil.descricao}` : 'Gerenciar Autorizações'" 
    :style="{ width: '70vw' }" 
    modal 
    class="p-fluid"
  >
    <!-- Topo: Filtro por Entidade, Contador, Pesquisa e Ações em Massa -->
    <div class="flex flex-col md:flex-row justify-between items-end md:items-center gap-3 mb-4 bg-surface-50 dark:bg-surface-800 p-3 rounded-border border border-surface-200 dark:border-surface-700">
      
      <!-- Bloco Esquerdo: Filtros (Entidade + Texto) e Contador -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto flex-1">
        <div class="w-full sm:w-72">
          <label class="block text-xs font-semibold text-surface-500 mb-1">Filtrar por Entidade:</label>
          <Dropdown 
            v-model="entidadeSelecionada" 
            :options="entidadesOptions" 
            optionLabel="descricao" 
            placeholder="Todas as Entidades" 
            class="w-full"
            showClear
            filter
            filterPlaceholder="Buscar entidade..."
          />
        </div>

        <div class="w-full sm:w-64">
          <label class="block text-xs font-semibold text-surface-500 mb-1">Pesquisar Rota / Ação:</label>
          <InputText 
            v-model="buscaTexto" 
            placeholder="Ex: .index, organizacao..." 
            class="w-full" 
          />
        </div>

        <!-- Contador de Linhas -->
        <div class="flex items-center self-end sm:self-center pt-4 sm:pt-0">
          <Tag :value="`${acoesFiltradas.length} ${acoesFiltradas.length === 1 ? 'ação encontrada' : 'ações encontradas'}`" severity="secondary" class="text-xs font-medium" />
        </div>
      </div>

      <!-- Bloco Direito: Botões em Massa -->
      <div class="flex gap-2 w-full md:w-auto justify-end">
        <Button 
          label="Marcar (SIM)" 
          icon="pi pi-check-square" 
          severity="success" 
          size="small" 
          outlined 
          @click="definirEmMassa('SIM')" 
          :disabled="loading || acoesFiltradas.length === 0"
        />
        <Button 
          label="Desmarcar (NÃO)" 
          icon="pi pi-square" 
          severity="danger" 
          size="small" 
          outlined 
          @click="definirEmMassa('NAO')" 
          :disabled="loading || acoesFiltradas.length === 0"
        />
      </div>
    </div>

    <!-- Spinner de Carregamento -->
    <div v-if="loading" class="flex justify-center py-12">
      <ProgressSpinner style="width: 45px; height: 45px;" />
    </div>

    <!-- Tabela / Lista de Autorizações com Paginação -->
    <div v-else class="border border-surface-200 dark:border-surface-700 rounded-border overflow-hidden">
      <DataTable 
        :value="acoesFiltradas" 
        dataKey="id" 
        responsiveLayout="scroll" 
        size="small"
        paginator 
        :rows="10" 
        :rowsPerPageOptions="[10, 25, 50]"
      >
        <template #empty>
          <div class="text-center py-8 text-surface-400 italic">Nenhuma ação encontrada para os filtros aplicados.</div>
        </template>

        <Column field="entidadeDescricao" header="Entidade" sortable style="width: 25%" />
        
        <Column field="acao" header="Rota / Ação" sortable style="width: 30%">
          <template #body="{ data }">
            <span class="font-mono text-xs font-semibold text-primary">{{ data.acao || data.rota }}</span>
          </template>
        </Column>

        <Column header="Nome Amigável / Descrição" style="width: 30%">
          <template #body="{ data }">
            <span class="text-sm text-surface-600 dark:text-surface-300">{{ data.nomeAmigavel || data.nome_amigavel || data.descricao || 'N/A' }}</span>
          </template>
        </Column>

        <Column header="Permissão" style="width: 15%" class="text-center">
          <template #body="{ data }">
            <div class="flex items-center justify-center gap-2">
              <span class="text-xs font-bold" :class="data.ativo === 'SIM' ? 'text-green-600' : 'text-red-500'">
                {{ data.ativo === 'SIM' ? 'SIM' : 'NÃO' }}
              </span>
              <ToggleSwitch 
                :modelValue="data.ativo === 'SIM'" 
                :disabled="salvandoId === data.id"
                @update:modelValue="() => alterarAutorizacao(data.id, data.ativo)" 
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <template #footer>
      <Button label="Fechar" icon="pi pi-times" severity="secondary" @click="fechar" />
    </template>
  </Dialog>
</template>