/**
 * Script para verificar se o usuário admin existe
 */
const axios = require('axios');

async function checkAdminUser() {
  try {
    console.log('Verificando se o usuário admin existe...');
    const response = await axios.get('http://localhost:3001/api/auth/check-admin');
    
    console.log('Resposta da API:');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.exists) {
      console.log('✅ O usuário admin foi encontrado!');
    } else {
      console.log('❌ O usuário admin não foi encontrado!');
      console.log('Você pode rodar o script reset-admin.js para criar o usuário.');
    }
  } catch (error) {
    console.error('Erro ao verificar usuário admin:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Dados:', error.response.data);
    }
  }
}

checkAdminUser(); 