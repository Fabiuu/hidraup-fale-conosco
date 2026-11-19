#!/usr/bin/env python3
"""
Build script para Hidraup — Fale com o Diretor
Copia public/ para dist/ usando apenas stdlib Python.
Uso: python3 build.py
"""
import os
import shutil
import sys
from pathlib import Path

def main():
    project_root = Path(__file__).parent.resolve()
    public_dir = project_root / 'public'
    dist_dir = project_root / 'dist'
    
    if not public_dir.exists():
        print(f'ERRO: Diretório public/ não encontrado em {public_dir}', file=sys.stderr)
        return 1
    
    # Remove dist anterior se existir
    if dist_dir.exists():
        shutil.rmtree(dist_dir)
        print(f'Removido: {dist_dir}')
    
    # Copia public -> dist
    shutil.copytree(public_dir, dist_dir)
    print(f'Copiado: {public_dir} -> {dist_dir}')
    
    # Lista arquivos copiados
    print('\nArquivos em dist/:')
    for root, dirs, files in os.walk(dist_dir):
        for f in sorted(files):
            rel = Path(root).relative_to(dist_dir) / f
            size = (Path(root) / f).stat().st_size
            print(f'  {rel} ({size:,} bytes)')
    
    print('\n✅ Build concluído com sucesso!')
    return 0

if __name__ == '__main__':
    sys.exit(main())
