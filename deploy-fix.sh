#!/bin/bash
# Deploy script para corrigir problema do FuncionarioDTO

echo "=== Fazendo pull do código ==="
ssh -i ~/.ssh/vps_deploy_key root@187.127.26.164 "cd /opt/lavameucarro && git pull origin main"

echo ""
echo "=== Build da API ==="
ssh -i ~/.ssh/vps_deploy_key root@187.127.26.164 "cd /opt/lavameucarro && docker compose build --no-cache api"

echo ""
echo "=== Restart da API ==="
ssh -i ~/.ssh/vps_deploy_key root@187.127.26.164 "cd /opt/lavameucarro && docker compose up -d api"

echo ""
echo "=== Deploy concluído! ==="
echo "Acesse: http://187.127.26.164:8082/admin/profissionais"
echo "Hard refresh: Ctrl+Shift+R"
