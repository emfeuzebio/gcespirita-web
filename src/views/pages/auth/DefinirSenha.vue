<script setup>
import { useRouter } from 'vue-router';
const router = useRouter();
</script>

<template>
    <div class="flex items-center justify-center min-h-screen bg-surface-50 dark:bg-surface-950">
        <div class="bg-surface-0 dark:bg-surface-900 p-8 rounded-lg shadow text-center max-w-md">
            <h2 class="text-2xl font-medium mb-4">Definir senha</h2>
            <p class="text-muted-color mb-6">Tela em implementação. Em breve você poderá definir sua nova senha aqui.</p>
            <Button label="Voltar ao login" @click="router.push({ name: 'login' })" />
        </div>
    </div>
</template>