{
  lib,
  fetchFromGitHub,
  stdenv,
  pkgs
}:

stdenv.mkDerivation {
  name = "inksync-cli";
  src = fetchFromGitHub {
    owner = "firesquid6";
    repo = "inksync";
    hash = "";
  };
  buildInputs = with pkgs; [
    bun
    typescript
  ];
  buildPhase = ''
    bun install
    cd packages/cli
    bun run build
  '';
  installPhase = ''
    mkdir -p $out/bin
    cp packages/cli/
  '';
  
}

