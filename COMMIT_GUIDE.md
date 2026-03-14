# Commit Guide

Use este fluxo para os proximos commits neste repositorio.

## Fluxo padrao

1. Ver o estado atual:

```bash
git status --short
```

2. Revisar apenas o diff da mudanca que voce quer commitar:

```bash
git diff -- <arquivo-ou-pasta>
```

3. Adicionar somente os arquivos desejados:

```bash
git add -- <arquivo1> <arquivo2> <arquivo3>
```

4. Conferir o stage antes do commit:

```bash
git diff --cached --stat
git diff --cached --name-only
```

5. Criar o commit:

```bash
git commit -m "tipo: resumo curto"
```

6. Enviar para a branch atual:

```bash
git push
```

## Exemplo real

```bash
git add -- \
  bpo360-app/src/app/'(bpo)'/clientes/_components/clientes-list.tsx \
  bpo360-app/src/app/'(bpo)'/clientes/_components/clientes-list.test.tsx \
  _bmad-output/implementation-artifacts/1-4-listar-e-filtrar-clientes.md

git diff --cached --stat
git commit -m "fix: adjust clientes list behavior"
git push
```

## Regras deste projeto

- `bpo360-app/` agora e um diretorio normal versionado neste repositorio.
- Pode usar `git add -- bpo360-app/...` diretamente.
- Nao use `git add .` neste projeto.
- Sempre selecione os arquivos manualmente.

## Evitar commitar por engano

Revise com cuidado antes de commitar se aparecerem arquivos como:

- `/.codex/`
- `/.claude/`
- stories nao relacionadas em `_bmad-output/implementation-artifacts/`
- arquivos locais temporarios
- artefatos de build ou ambiente

## Convencao de mensagens

- `fix: ...` para correcao
- `feat: ...` para funcionalidade nova
- `test: ...` para testes
- `docs: ...` para documentacao e artefatos
- `refactor: ...` para refatoracao sem mudanca funcional

## Checagem final

Antes de subir:

```bash
git status --short
```

Se houver arquivos nao relacionados, nao inclua no commit.
