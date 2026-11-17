<script setup>
import { organizacoesApi } from '@/api/endpoints/organizacoes';
import { usuariosApi } from '@/api/endpoints/usuarios';
import { useToast } from 'primevue/usetoast';
import { ref, watch } from 'vue';

const props = defineProps({
  visible: { type: Boolean, default: false },
  usuario: { type: Object, default: null },
});
const emit = defineEmits(['update:visible', 'salvo']);

const toast = useToast();

const form = ref({
  nome: '',
  email: '',
  organizacao_id: null,
  ativo: true,
  precisa_trocar_senha: true,
  password: ''
});

const organizacoes = ref([]);
const errors = ref({});
const saving = ref(false);

async function carregarOrganizacoes() {
  try {
    const res = await organizacoesApi.list();
    organizacoes.value = res.data ?? [];
  } catch (err) {
    console.error('Erro ao carregar organizações', err);
  }
}

watch(
  () => props.visible,
  async (v) => {
    if (v) {
      await carregarOrganizacoes();
      form.value = props.usuario
        ? {
            nome: props.usuario.nome ?? '',
            email: props.usuario.email ?? '',
            organizacao_id: props.usuario.organizacao_id ?? null,
            ativo: props.usuario.ativo === 'SIM',
            precisa_trocar_senha: props.usuario.precisa_trocar_senha === 'SIM',
            password: ''
          }
        : {
            nome: '',
            email: '',
            organizacao_id: null,
            ativo: true,
            precisa_trocar_senha: true,
            password: ''
          };
      errors.value = {};
    }
  }
);

function close() {
  emit('update:visible', false);
}

async function salvar() {
  saving.value = true;
  errors.value = {};
  try {
    const payload = {
      ...form.value,
      organizacao_id: form.value.organizacao_id ? Number(form.value.organizacao_id) : null,
      ativo: form.value.ativo ? 'SIM' : 'NAO',
      precisa_trocar_senha: form.value.precisa_trocar_senha ? 'SIM' : 'NAO'
    };

    if (props.usuario?.id) {
      if (!payload.password) delete payload.password;
      
      await usuariosApi.update(props.usuario.id, payload);
      toast.add({ severity: 'success', summary: 'Atualizado', detail: 'Usuário atualizado com sucesso.', life: 3000 });
    } else {
      await usuariosApi.create(payload);
      toast.add({ severity: 'success', summary: 'Criado', detail: 'Usuário criado com sucesso.', life: 3000 });
    }
    emit('salvo');
  } catch (err) {
    errors.value = err.errors || {};
    if (err.status === 422) {
      toast.add({ severity: 'warn', summary: 'Verifique os campos', detail: err.message, life: 4000 });
    } else {
      toast.add({ severity: 'error', summary: 'Erro', detail: err.message, life: 4000 });
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
    :header="usuario?.id ? 'Editar Usuário' : 'Novo Usuário'"
    :modal="true"
    :style="{ width: '650px' }"
    @hide="close"
  >
    <div class="flex flex-col gap-4">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label for="nome" class="block text-sm font-medium mb-2">Nome *</label>
          <InputText
            id="nome"
            v-model="form.nome"
            class="w-full"
            :invalid="!!errors.nome"
            autofocus
            v-tooltip.top="'Digite o nome completo do usuário'"
          />
          <small v-if="errors.nome" class="text-red-500 block mt-1">{{ errors.nome.join(' ') }}</small>
        </div>
        <div>
          <label for="email" class="block text-sm font-medium mb-2">E-mail *</label>
          <InputText
            id="email"
            v-model="form.email"
            type="email"
            class="w-full"
            :invalid="!!errors.email"
            v-tooltip.top="'Endereço de e-mail utilizado para login e notificações'"
          />
          <small v-if="errors.email" class="text-red-500 block mt-1">{{ errors.email.join(' ') }}</small>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label for="organizacao_id" class="block text-sm font-medium mb-2">Organização *</label>
          <Select
            id="organizacao_id"
            v-model="form.organizacao_id"
            :options="organizacoes"
            optionLabel="nome"
            optionValue="id"
            placeholder="Selecione a organização"
            class="w-full"
            :invalid="!!errors.organizacao_id"
            filter
            v-tooltip.top="'Selecione a organização (tenant) à qual o usuário pertence'"
          />
          <small v-if="errors.organizacao_id" class="text-red-500 block mt-1">{{ errors.organizacao_id.join(' ') }}</small>
        </div>
        <div>
          <label for="password" class="block text-sm font-medium mb-2">Senha {{ usuario?.id ? '(Opcional)' : '*' }}</label>
          <Password
            id="password"
            v-model="form.password"
            :feedback="false"
            toggleMask
            class="w-full"
            :invalid="!!errors.password"
            v-tooltip.top="usuario?.id ? 'Deixe em branco para manter a senha atual' : 'Informe a senha inicial de acesso'"
          />
          <small v-if="errors.password" class="text-red-500 block mt-1">{{ errors.password.join(' ') }}</small>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-6 pt-2">
        <div class="flex items-center gap-3">
          <ToggleSwitch
            v-model="form.ativo"
            id="ativo"
            v-tooltip.top="'Define se o usuário pode acessar o sistema'"
          />
          <label for="ativo" class="font-medium cursor-pointer">Ativo</label>
        </div>
        <div class="flex items-center gap-3">
          <ToggleSwitch
            v-model="form.precisa_trocar_senha"
            id="precisa_trocar_senha"
            v-tooltip.top="'Exige que o usuário redefina a senha no próximo login'"
          />
          <label for="precisa_trocar_senha" class="font-medium cursor-pointer">Trocar Senha no Próximo Acesso</label>
        </div>
      </div>
    </div>

    <template #footer>
      <Button label="Cancelar" severity="secondary" text @click="close" :disabled="saving" v-tooltip.top="'Cancelar operação'" />
      <Button label="Salvar" icon="pi pi-check" @click="salvar" :loading="saving" v-tooltip.top="'Salvar registro'" />
    </template>
  </Dialog>
</template>