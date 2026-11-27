<script setup>
import { authApi } from '@/api/endpoints/auth';
import FloatingConfigurator from '@/components/FloatingConfigurator.vue';
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const router = useRouter();
const route = useRoute();

const token = ref('');
const email = ref('');
const novaSenha = ref('');
const confirmacao = ref('');

const loading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const fieldErrors = ref({});

onMounted(() => {
    token.value = String(route.query.token ?? '');
    email.value = String(route.query.email ?? '');

    if (!token.value || !email.value) {
        errorMessage.value = 'Link inválido. Solicite um novo convite ao administrador.';
    }
});

async function onSubmit() {
    loading.value = true;
    errorMessage.value = '';
    successMessage.value = '';
    fieldErrors.value = {};

    if (novaSenha.value !== confirmacao.value) {
        fieldErrors.value = { nova_senha: ['As senhas não conferem.'] };
        loading.value = false;
        return;
    }

    try {
        await authApi.definirSenha(email.value, token.value, novaSenha.value);
        successMessage.value = 'Senha definida com sucesso! Redirecionando para o login...';
        setTimeout(() => router.push({ name: 'login' }), 2000);
    } catch (err) {
        errorMessage.value = err.message || 'Não foi possível definir a senha.';
        fieldErrors.value = err.errors || {};
    } finally {
        loading.value = false;
    }
}
</script>

<template>
    <FloatingConfigurator />
    <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-[100vw] overflow-hidden">
        <div class="flex flex-col items-center justify-center">
            <div style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)">
                <div class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20" style="border-radius: 53px">
                    <div class="text-center mb-8">
                        <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">Definir senha</div>
                        <span class="text-muted-color font-medium">Crie uma nova senha para acessar sua conta</span>
                    </div>

                    <form @submit.prevent="onSubmit">
                        <div v-if="errorMessage" class="mb-4 p-3 rounded bg-red-100 text-red-700 text-sm">
                            {{ errorMessage }}
                        </div>
                        <div v-if="successMessage" class="mb-4 p-3 rounded bg-green-100 text-green-700 text-sm">
                            {{ successMessage }}
                        </div>

                        <label for="email" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">E-mail</label>
                        <InputText id="email" type="text" v-model="email" class="w-full md:w-[30rem] mb-1" disabled />
                        <div class="mb-8"></div>

                        <label for="novaSenha" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Nova senha</label>
                        <Password id="novaSenha" v-model="novaSenha" placeholder="Nova senha" :toggleMask="true" class="mb-1" fluid :feedback="true" inputClass="w-full" autocomplete="new-password" />
                        <small v-if="fieldErrors.nova_senha" class="text-red-500 block mb-4">{{ fieldErrors.nova_senha.join(' ') }}</small>
                        <div v-else class="mb-4"></div>

                        <label for="confirmacao" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Confirmar nova senha</label>
                        <Password id="confirmacao" v-model="confirmacao" placeholder="Repita a nova senha" :toggleMask="true" class="mb-1" fluid :feedback="false" inputClass="w-full" autocomplete="new-password" />
                        <small v-if="fieldErrors.confirmacao" class="text-red-500 block mb-4">{{ fieldErrors.confirmacao.join(' ') }}</small>
                        <div v-else class="mb-8"></div>

                        <Button type="submit" label="Definir senha" class="w-full" :loading="loading" :disabled="!token || !email"></Button>

                        <div class="text-center mt-6">
                            <span class="font-medium no-underline cursor-pointer text-primary" @click="router.push({ name: 'login' })">Voltar ao login</span>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.pi-eye {
    transform: scale(1.6);
    margin-right: 1rem;
}

.pi-eye-slash {
    transform: scale(1.6);
    margin-right: 1rem;
}
</style>