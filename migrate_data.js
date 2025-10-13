/**
 * ═════════════════════════════════════════════════════════════════════════
 * SCRIPT DE MIGRAÇÃO DE DADOS - LOVABLE CLOUD → SUPABASE
 * ═════════════════════════════════════════════════════════════════════════
 * 
 * Este script migra todos os dados do banco Lovable Cloud para o novo
 * projeto Supabase (trusmile).
 * 
 * IMPORTANTE: Execute este script APENAS UMA VEZ para evitar duplicação!
 * 
 * USO:
 *   node migrate_data.js
 * 
 * PRÉ-REQUISITOS:
 *   npm install @supabase/supabase-js
 * ═════════════════════════════════════════════════════════════════════════
 */

import { createClient } from '@supabase/supabase-js';

// ═════════════════════════════════════════════════════════════════════════
// CONFIGURAÇÕES
// ═════════════════════════════════════════════════════════════════════════

// LOVABLE CLOUD (Origem) - ATUALIZADO PARA O PROJETO CORRETO
const SOURCE_URL = 'https://hqexulgmmtghwtgnqtfy.supabase.co';
const SOURCE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhxZXh1bGdtbXRnaHd0Z25xdGZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwMzg1NzksImV4cCI6MjA3NTYxNDU3OX0.7G8MdMj2lSj8Ov9bacg6GkaLpMMiNFXAPceIbH8uVXk';

// SUPABASE NOVO (Destino)
const TARGET_URL = 'https://hqexulgmmtghwtgnqtfy.supabase.co';
const TARGET_KEY = 'SUA_SERVICE_ROLE_KEY_AQUI'; // ⚠️ IMPORTANTE: Use a SERVICE_ROLE KEY, não a anon key!

// Ordem de migração (respeita dependências entre tabelas)
const TABLES_ORDER = [
  'patients',
  'user_configs',
  'user_roles',
  'services',
  'simulations',
  'budgets',
  'leads',
  'activities',
  'crm_leads',
  'reports'
];

// ═════════════════════════════════════════════════════════════════════════
// CLIENTES SUPABASE
// ═════════════════════════════════════════════════════════════════════════

const sourceDB = createClient(SOURCE_URL, SOURCE_KEY);
const targetDB = createClient(TARGET_URL, TARGET_KEY);

// ═════════════════════════════════════════════════════════════════════════
// FUNÇÕES AUXILIARES
// ═════════════════════════════════════════════════════════════════════════

function log(emoji, message, ...args) {
  console.log(`${emoji} ${message}`, ...args);
}

function logSuccess(message, ...args) {
  log('✅', message, ...args);
}

function logError(message, ...args) {
  log('❌', message, ...args);
}

function logInfo(message, ...args) {
  log('ℹ️ ', message, ...args);
}

function logWarning(message, ...args) {
  log('⚠️ ', message, ...args);
}

// ═════════════════════════════════════════════════════════════════════════
// FUNÇÃO PRINCIPAL DE MIGRAÇÃO
// ═════════════════════════════════════════════════════════════════════════

async function migrateTable(tableName) {
  logInfo(`Iniciando migração da tabela: ${tableName}`);
  
  try {
    // 1. Buscar dados da origem
    const { data: sourceData, error: fetchError } = await sourceDB
      .from(tableName)
      .select('*');
    
    if (fetchError) {
      logError(`Erro ao buscar dados de ${tableName}:`, fetchError.message);
      return { success: false, table: tableName, count: 0, error: fetchError.message };
    }
    
    if (!sourceData || sourceData.length === 0) {
      logWarning(`Tabela ${tableName} está vazia. Pulando...`);
      return { success: true, table: tableName, count: 0 };
    }
    
    logInfo(`${tableName}: ${sourceData.length} registros encontrados`);
    
    // 2. Inserir dados no destino (em lotes de 100)
    const BATCH_SIZE = 100;
    let totalInserted = 0;
    let errors = [];
    
    for (let i = 0; i < sourceData.length; i += BATCH_SIZE) {
      const batch = sourceData.slice(i, i + BATCH_SIZE);
      
      const { data: insertedData, error: insertError } = await targetDB
        .from(tableName)
        .insert(batch)
        .select();
      
      if (insertError) {
        logError(`Erro ao inserir lote ${Math.floor(i / BATCH_SIZE) + 1} de ${tableName}:`, insertError.message);
        errors.push({
          batch: Math.floor(i / BATCH_SIZE) + 1,
          error: insertError.message
        });
        continue;
      }
      
      totalInserted += insertedData?.length || 0;
      logInfo(`${tableName}: ${totalInserted}/${sourceData.length} registros migrados`);
    }
    
    if (errors.length > 0) {
      logWarning(`${tableName}: ${errors.length} lote(s) com erro`);
      return { 
        success: false, 
        table: tableName, 
        count: totalInserted, 
        total: sourceData.length,
        errors 
      };
    }
    
    logSuccess(`${tableName}: ${totalInserted} registros migrados com sucesso!`);
    return { success: true, table: tableName, count: totalInserted };
    
  } catch (error) {
    logError(`Erro inesperado ao migrar ${tableName}:`, error.message);
    return { success: false, table: tableName, count: 0, error: error.message };
  }
}

// ═════════════════════════════════════════════════════════════════════════
// EXECUÇÃO PRINCIPAL
// ═════════════════════════════════════════════════════════════════════════

async function main() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('🚀 MIGRAÇÃO DE DADOS: LOVABLE CLOUD → SUPABASE');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  // Validar configuração
  if (TARGET_KEY === 'SUA_SERVICE_ROLE_KEY_AQUI') {
    logError('ERRO: Configure a TARGET_KEY com sua service_role key do Supabase!');
    logInfo('Para obter a service_role key:');
    logInfo('1. Acesse: https://supabase.com/dashboard/project/hqexulgmmtghwtgnqtfy/settings/api');
    logInfo('2. Copie a "service_role" key (secret)');
    logInfo('3. Cole no arquivo migrate_data.js na variável TARGET_KEY');
    process.exit(1);
  }
  
  const startTime = Date.now();
  const results = [];
  
  // Migrar cada tabela na ordem correta
  for (const table of TABLES_ORDER) {
    const result = await migrateTable(table);
    results.push(result);
    console.log(''); // Linha em branco entre tabelas
  }
  
  // Resumo final
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('📊 RESUMO DA MIGRAÇÃO');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  const totalRecords = results.reduce((sum, r) => sum + r.count, 0);
  
  logSuccess(`Tabelas migradas com sucesso: ${successful.length}/${results.length}`);
  
  if (failed.length > 0) {
    logError(`Tabelas com erro: ${failed.length}`);
    failed.forEach(f => {
      logError(`  - ${f.table}: ${f.error || 'Erro desconhecido'}`);
    });
  }
  
  logInfo(`Total de registros migrados: ${totalRecords}`);
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  logInfo(`Tempo total: ${duration}s`);
  
  console.log('\n═══════════════════════════════════════════════════════════════');
  
  if (failed.length === 0) {
    logSuccess('🎉 MIGRAÇÃO CONCLUÍDA COM SUCESSO!');
  } else {
    logWarning('⚠️  MIGRAÇÃO CONCLUÍDA COM ALGUNS ERROS');
    logInfo('Revise os erros acima e execute novamente se necessário.');
  }
  
  console.log('═══════════════════════════════════════════════════════════════\n');
}

// Executar
main().catch(error => {
  logError('Erro fatal:', error);
  process.exit(1);
});

