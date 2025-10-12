/**
 * ═════════════════════════════════════════════════════════════════════════
 * SCRIPT DE MIGRAÇÃO DE STORAGE - LOVABLE CLOUD → SUPABASE
 * ═════════════════════════════════════════════════════════════════════════
 * 
 * Este script migra todos os arquivos dos buckets de storage do Lovable
 * Cloud para o novo projeto Supabase (trusmile).
 * 
 * BUCKETS:
 *   - budgets (PDFs de orçamentos)
 *   - technical-reports (Relatórios técnicos)
 *   - original-images (Imagens originais)
 *   - processed-images (Imagens processadas)
 * 
 * USO:
 *   node migrate_storage.js
 * 
 * PRÉ-REQUISITOS:
 *   npm install @supabase/supabase-js
 * ═════════════════════════════════════════════════════════════════════════
 */

import { createClient } from '@supabase/supabase-js';

// ═════════════════════════════════════════════════════════════════════════
// CONFIGURAÇÕES
// ═════════════════════════════════════════════════════════════════════════

// LOVABLE CLOUD (Origem)
const SOURCE_URL = 'https://emlllyoovwdzajhrwydz.supabase.co';
const SOURCE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtbGxseW9vdndkemFqaHJ3eWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyMzAzMTIsImV4cCI6MjA3NDgwNjMxMn0.UTCKwc_WaUeVig9fQT_T4gQA8uk3EcsD-G8Xz-D3_Pg';

// SUPABASE NOVO (Destino)
const TARGET_URL = 'https://hqexulgmmtghwtgnqtfy.supabase.co';
const TARGET_KEY = 'SUA_SERVICE_ROLE_KEY_AQUI'; // ⚠️ IMPORTANTE: Use a SERVICE_ROLE KEY!

// Buckets para migrar
const BUCKETS = [
  'budgets',
  'technical-reports',
  'original-images',
  'processed-images'
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

async function migrateBucket(bucketName) {
  logInfo(`Iniciando migração do bucket: ${bucketName}`);
  
  try {
    // 1. Listar arquivos do bucket de origem
    const { data: files, error: listError } = await sourceDB
      .storage
      .from(bucketName)
      .list('', {
        limit: 1000,
        sortBy: { column: 'name', order: 'asc' }
      });
    
    if (listError) {
      logError(`Erro ao listar arquivos de ${bucketName}:`, listError.message);
      return { success: false, bucket: bucketName, count: 0, error: listError.message };
    }
    
    if (!files || files.length === 0) {
      logWarning(`Bucket ${bucketName} está vazio. Pulando...`);
      return { success: true, bucket: bucketName, count: 0 };
    }
    
    logInfo(`${bucketName}: ${files.length} arquivo(s) encontrado(s)`);
    
    // 2. Migrar cada arquivo
    let migratedCount = 0;
    const errors = [];
    
    for (const file of files) {
      try {
        // Baixar arquivo da origem
        const { data: fileData, error: downloadError } = await sourceDB
          .storage
          .from(bucketName)
          .download(file.name);
        
        if (downloadError) {
          logError(`  Erro ao baixar ${file.name}:`, downloadError.message);
          errors.push({ file: file.name, error: downloadError.message });
          continue;
        }
        
        // Upload para o destino
        const { error: uploadError } = await targetDB
          .storage
          .from(bucketName)
          .upload(file.name, fileData, {
            contentType: file.metadata?.mimetype || 'application/octet-stream',
            upsert: true // Sobrescrever se já existir
          });
        
        if (uploadError) {
          logError(`  Erro ao fazer upload de ${file.name}:`, uploadError.message);
          errors.push({ file: file.name, error: uploadError.message });
          continue;
        }
        
        migratedCount++;
        logInfo(`  ✓ ${file.name} (${(file.metadata?.size / 1024).toFixed(2)} KB)`);
        
      } catch (error) {
        logError(`  Erro inesperado ao migrar ${file.name}:`, error.message);
        errors.push({ file: file.name, error: error.message });
      }
    }
    
    if (errors.length > 0) {
      logWarning(`${bucketName}: ${errors.length} arquivo(s) com erro`);
      return {
        success: false,
        bucket: bucketName,
        count: migratedCount,
        total: files.length,
        errors
      };
    }
    
    logSuccess(`${bucketName}: ${migratedCount} arquivo(s) migrado(s) com sucesso!`);
    return { success: true, bucket: bucketName, count: migratedCount };
    
  } catch (error) {
    logError(`Erro inesperado ao migrar bucket ${bucketName}:`, error.message);
    return { success: false, bucket: bucketName, count: 0, error: error.message };
  }
}

// ═════════════════════════════════════════════════════════════════════════
// EXECUÇÃO PRINCIPAL
// ═════════════════════════════════════════════════════════════════════════

async function main() {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('🗂️  MIGRAÇÃO DE STORAGE: LOVABLE CLOUD → SUPABASE');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  // Validar configuração
  if (TARGET_KEY === 'SUA_SERVICE_ROLE_KEY_AQUI') {
    logError('ERRO: Configure a TARGET_KEY com sua service_role key do Supabase!');
    logInfo('Para obter a service_role key:');
    logInfo('1. Acesse: https://supabase.com/dashboard/project/hqexulgmmtghwtgnqtfy/settings/api');
    logInfo('2. Copie a "service_role" key (secret)');
    logInfo('3. Cole no arquivo migrate_storage.js na variável TARGET_KEY');
    process.exit(1);
  }
  
  const startTime = Date.now();
  const results = [];
  
  // Migrar cada bucket
  for (const bucket of BUCKETS) {
    const result = await migrateBucket(bucket);
    results.push(result);
    console.log(''); // Linha em branco entre buckets
  }
  
  // Resumo final
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('📊 RESUMO DA MIGRAÇÃO DE STORAGE');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  const totalFiles = results.reduce((sum, r) => sum + r.count, 0);
  
  logSuccess(`Buckets migrados com sucesso: ${successful.length}/${results.length}`);
  
  if (failed.length > 0) {
    logError(`Buckets com erro: ${failed.length}`);
    failed.forEach(f => {
      logError(`  - ${f.bucket}: ${f.error || 'Erro desconhecido'}`);
      if (f.errors && f.errors.length > 0) {
        f.errors.forEach(e => {
          logError(`    • ${e.file}: ${e.error}`);
        });
      }
    });
  }
  
  logInfo(`Total de arquivos migrados: ${totalFiles}`);
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  logInfo(`Tempo total: ${duration}s`);
  
  console.log('\n═══════════════════════════════════════════════════════════════');
  
  if (failed.length === 0) {
    logSuccess('🎉 MIGRAÇÃO DE STORAGE CONCLUÍDA COM SUCESSO!');
  } else {
    logWarning('⚠️  MIGRAÇÃO DE STORAGE CONCLUÍDA COM ALGUNS ERROS');
    logInfo('Revise os erros acima e execute novamente se necessário.');
  }
  
  console.log('═══════════════════════════════════════════════════════════════\n');
}

// Executar
main().catch(error => {
  logError('Erro fatal:', error);
  process.exit(1);
});

