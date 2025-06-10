{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };
  description = "Inksync";

  outputs = { self, nixpkgs, flake-utils }: flake-utils.lib.eachDefaultSystem (system:
    let
      pkgs = import nixpkgs { inherit system; };
      commonBuildInputs = with pkgs; [
        bun
        nodejs_20
        flyctl
        typescript
      ];
    in
    rec {
      devShell = pkgs.mkShell {
        buildInputs = commonBuildInputs;
      };
      packages.default = pkgs.buildNpmPackage {
        name = "inksync-cli";
        src = self;

        npmDepsHash = "sha256-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";

        buildInputs = commonBuildInputs;
        buildPhase = ''
          echo "installing..."
          bun install
          cd packages/cli
          bun run build
        '';
        installPhase = ''
          mkdir -p $out/bin
          cp packages/cli/build/index.js $out/bin/index.js
        '';
      };
    }
  );
}
