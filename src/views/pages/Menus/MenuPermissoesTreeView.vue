<script setup>
import { menusApi } from '@/api/endpoints/menus';
import { perfisApi } from '@/api/endpoints/perfis';
import { faToPi } from '@/utils/faToPi';
import { useToast } from 'primevue/usetoast';
import { computed, onMounted, ref, watch } from 'vue';

const toast = useToast();

// ─── Estado ────────────────────────────────────────────────────────────
const perfis = ref([]);
const moduloSelecionado = ref(null);
const perfilSelecionado = ref(null);

const arvoreCompleta = ref([]);           // GET /acl/menus (árvore inteira, com key)
const permissoes = ref(new Map());        // Map<perfilId, Set<menuId>>
const loading = ref(false);
const carregandoPermissoes = ref(false);
const salvandoMenuId = ref(null);         // menu_id em POST (evita clique duplo)
const buscaTexto = ref('');

// ─── Computeds ─────────────────────────────────────────────────────────
const modulosDisponiveis = computed(() => {
  const mapa = new Map();
  const coletar = (nos) => {
    for (const n of nos ?? []) {
      if (n.modulo && !mapa.has(n.modulo.id)) {
        mapa.set(n.modulo.id, n.modulo);
      }
      coletar(n.children);
    }
  };
  coletar(arvoreCompleta.value);
  return Array.from(mapa.values());
});

const arvoreFiltrada = computed(() => {
  const moduloId = moduloSelecionado.value?.id;
  if (!moduloId) return [];
  return filtrarPorModulo(arvoreCompleta.value, moduloId);
});

const arvoreVisivel = computed(() =>
  filtrarPorBusca(arvoreFiltrada.value, buscaTexto.value)
);

const podeEditar = computed(
  () => !!moduloSelecionado.value && !!perfilSelecionado.value
);

const perfisVinculados = computed(() => {
  const perfilId = perfilSelecionado.value?.id;
  if (!perfilId) return new Set();
  return permissoes.value.get(perfilId) ?? new Set();
});

// ─── Funções auxiliares ────────────────────────────────────────────────
function comKey(nos) {
  return (nos ?? []).map((n) => ({
    ...n,
    key: n.id,
    children: n.children ? comKey(n.children) : [],
  }));
}

function filtrarPorModulo(nos, moduloId) {
  const resultado = [];
  for (const n of nos ?? []) {
    const children = filtrarPorModulo(n.children ?? [], moduloId);
    const pertence = n.modulo_id === moduloId;
    if (pertence) {
      // Inclui o nó e todos os seus descendentes (mesmo que de outros módulos? não — menus são do módulo)
      resultado.push({ ...n, children: comKeyOriginal(n.children ?? []) });
    } else if (children.length > 0) {
      resultado.push({ ...n, children });
    }
  }
  return resultado;
}

function comKeyOriginal(nos) {
  return (nos ?? []).map((n) => ({
    ...n,
    key: n.id,
    children: comKeyOriginal(n.children ?? []),
  }));
}

function filtrarPorBusca(nos, termo) {
  if (!termo) return nos;
  const t = termo.toLowerCase();
  const resultado = [];
  for (const n of nos ?? []) {
    const children = filtrarPorBusca(n.children ?? [], termo);
    const matchTitulo = (n.titulo ?? '').toLowerCase().includes(t);
    if (matchTitulo || children.length > 0) {
      resultado.push({ ...n, children });
    }
  }
  return resultado;
}

// ─── Carregamento ──────────────────────────────────────────────────────
async function carregarBase() {
  loading.value = true;
  try {
    const [resMenus, resPerfis] = await Promise.all([
      menusApi.list(),
      perfisApi.list(),
    ]);
    arvoreCompleta.value = comKey(resMenus.data ?? []);
    perfis.value = (resPerfis.data ?? []).filter((p) => p.ativo === 'SIM');
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Erro',
      detail: err.message ?? 'Não foi possível carregar menus/perfis.',
      life: 4000,
    });
  } finally {
    loading.value = false;
  }
}

async function carregarPermissoesDoPerfil(perfilId) {
  if (permissoes.value.has(perfilId)) return; // cache
  const menus = arvoreFiltrada.value;
  if (menus.length === 0) return;

  carregandoPermissoes.value = true;
  try {
    const ids = [];
    const coletar = (nos) => {
      for (const n of nos ?? []) {
        ids.push(n.id);
        coletar(n.children);
      }
    };
    coletar(menus);

    // N+1 paralelo (D9)
    const respostas = await Promise.all(
      ids.map((id) => menusApi.getPerfis(id).catch(() => ({ data: [] })))
    );

    const vinculados = new Set();
    respostas.forEach((res, i) => {
      const menuId = ids[i];
      const perfisDoMenu = res.data ?? [];
      const temAtivo = perfisDoMenu.some(
        (p) => p.id === perfilId && p.ativo === 'SIM'
      );
      if (temAtivo) vinculados.add(menuId);
    });

    permissoes.value = new Map(permissoes.value).set(perfilId, vinculados);
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Erro',
      detail: err.message ?? 'Não foi possível carregar as permissões.',
      life: 4000,
    });
  } finally {
    carregandoPermissoes.value = false;
  }
}

// ─── Toggle ────────────────────────────────────────────────────────────
async function togglePermissao(menuId) {
  if (!podeEditar.value || salvandoMenuId.value === menuId) return;

  const perfilId = perfilSelecionado.value.id;
  const vinculados = new Set(permissoes.value.get(perfilId) ?? []);
  const ativando = !vinculados.has(menuId);

  // Otimista
  if (ativando) vinculados.add(menuId);
  else vinculados.delete(menuId);
  permissoes.value = new Map(permissoes.value).set(perfilId, vinculados);

  salvandoMenuId.value = menuId;
  try {
    if (ativando) {
      await menusApi.vincularPerfil(menuId, perfilId);
    } else {
      await menusApi.desvincularPerfil(menuId, perfilId);
    }
    toast.add({
      severity: 'success',
      summary: ativando ? 'Concedido' : 'Revogado',
      detail: ativando
        ? 'Menu concedido ao perfil.'
        : 'Menu revogado do perfil.',
      life: 1500,
    });
  } catch (err) {
    // Rollback
    const revertido = new Set(permissoes.value.get(perfilId) ?? []);
    if (ativando) revertido.delete(menuId);
    else revertido.add(menuId);
    permissoes.value = new Map(permissoes.value).set(perfilId, revertido);

    toast.add({
      severity: 'error',
      summary: 'Erro',
      detail: err.message ?? 'Não foi possível salvar a permissão.',
      life: 4000,
    });
  } finally {
    salvandoMenuId.value = null;
  }
}

// ─── Watchers ──────────────────────────────────────────────────────────
watch(
  () => perfilSelecionado.value?.id,
  async (perfilId) => {
    if (perfilId && moduloSelecionado.value) {
      await carregarPermissoesDoPerfil(perfilId);
    }
  }
);

watch(
  () => moduloSelecionado.value?.id,
  async () => {
    buscaTexto.value = '';
    const perfilId = perfilSelecionado.value?.id;
    if (perfilId) {
      await carregarPermissoesDoPerfil(perfilId);
    }
  }
);

onMounted(carregarBase);
</script>

<template>
  <div class="card">
    <div class="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
      <div>
        <h2 class="text-2xl font-medium">Menus por Perfil</h2>
        <span class="text-sm text-surface-500">
          Defina quais itens de menu cada perfil de acesso enxerga no app
        </span>
      </div>
    </div>

    <!-- Filtros -->
    <div class="flex flex-col sm:flex-row gap-3 mb-4">
      <div class="w-full sm:w-72">
        <label class="block text-xs font-semibold text-surface-500 mb-1">
          Módulo <span class="text-red-500">*</span>
        </label>
        <Select
          v-model="moduloSelecionado"
          :options="modulosDisponiveis"
          optionLabel="nome"
          placeholder="Selecione um módulo"
          class="w-full"
          :loading="loading"
        />
      </div>

      <div class="w-full sm:w-72">
        <label class="block text-xs font-semibold text-surface-500 mb-1">
          Perfil <span class="text-red-500">*</span>
        </label>
        <Select
          v-model="perfilSelecionado"
          :options="perfis"
          optionLabel="descricao"
          placeholder="Selecione um perfil"
          class="w-full"
          :loading="loading"
        >
          <template #option="slotProps">
            <div class="flex items-center gap-2">
              <span class="font-semibold">{{ slotProps.option.sigla }}</span>
              <span class="text-surface-500 text-sm">{{ slotProps.option.descricao }}</span>
            </div>
          </template>
        </Select>
      </div>

      <div class="flex-1 w-full">
        <label class="block text-xs font-semibold text-surface-500 mb-1">Buscar</label>
        <InputText
          v-model="buscaTexto"
          placeholder="Filtrar por título do menu..."
          class="w-full"
          :disabled="!moduloSelecionado"
        />
      </div>
    </div>

    <!-- Estado vazio -->
    <div
      v-if="!podeEditar"
      class="flex flex-col items-center justify-center py-12 text-surface-400"
    >
      <i class="pi pi-info-circle text-4xl mb-3"></i>
      <p class="text-sm">
        Selecione um <strong>módulo</strong> e um <strong>perfil</strong> para gerenciar as permissões.
      </p>
    </div>

    <!-- Carregando permissões -->
    <div v-else-if="carregandoPermissoes" class="flex justify-center py-12">
      <ProgressSpinner style="width: 45px; height: 45px;" />
    </div>

    <!-- TreeTable -->
    <TreeTable
      v-else
      :value="arvoreVisivel"
      dataKey="key"
      responsiveLayout="scroll"
      :rowHover="true"
    >
      <template #empty>
        <div class="text-center py-8 text-surface-400 italic">
          Nenhum menu encontrado para este módulo.
        </div>
      </template>

      <Column field="titulo" header="Título" :expander="true" style="width: 35%">
        <template #body="{ node }">
          <span class="inline-flex items-center gap-2">
            <i v-if="node.icone" :class="faToPi(node.icone)"></i>
            <span>{{ node.titulo }}</span>
          </span>
        </template>
      </Column>

      <Column field="tipo" header="Tipo" style="width: 10rem">
        <template #body="{ node }">
          <Tag
            :value="node.tipo"
            :severity="
              node.tipo === 'separador'
                ? 'secondary'
                : node.tipo === 'grupo'
                  ? 'info'
                  : 'success'
            "
          />
        </template>
      </Column>

      <Column field="rota" header="Rota" style="width: 18rem">
        <template #body="{ node }">
          <span v-if="node.rota" class="font-mono text-xs">{{ node.rota }}</span>
          <span v-else class="text-muted-color">—</span>
        </template>
      </Column>

      <Column field="ativo" header="Ativo (global)" style="width: 10rem">
        <template #body="{ node }">
          <Tag
            :value="node.ativo"
            :severity="node.ativo === 'SIM' ? 'success' : 'danger'"
          />
        </template>
      </Column>

      <Column header="Permissão" style="width: 12rem" class="text-center">
        <template #body="{ node }">
          <div class="flex items-center justify-center gap-2">
            <span
              class="text-xs font-bold"
              :class="
                perfisVinculados.has(node.id) ? 'text-green-600' : 'text-red-500'
              "
            >
              {{ perfisVinculados.has(node.id) ? 'SIM' : 'NÃO' }}
            </span>
            <ToggleSwitch
              :modelValue="perfisVinculados.has(node.id)"
              :disabled="salvandoMenuId === node.id"
              @update:modelValue="() => togglePermissao(node.id)"
              v-tooltip.top="
                salvandoMenuId === node.id
                  ? 'Salvando...'
                  : perfisVinculados.has(node.id)
                    ? 'Clique para revogar este menu do perfil.'
                    : 'Clique para conceder este menu ao perfil.'
              "
            />
          </div>
        </template>
      </Column>
    </TreeTable>
  </div>
</template>