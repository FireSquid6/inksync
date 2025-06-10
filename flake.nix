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

      node-modules = pkgs.mkYarnPackage {
        name = "node-modules";
        src = self;
      };
    in
    rec {
      devShell = pkgs.mkShell {
        buildInputs = commonBuildInputs;
      };
      packages.default = pkgs.stdenv.mkDerivation {
        name = "inksync-cli";
        src = self;

        buildInputs = commonBuildInputs;
        buildPhase = ''
          ln -s ${node-modules}/libexec/inksync-monorepo/node_modules node_modules
          cd packages/cli
          ${pkgs.bun}/bin/bun run build
        '';
        installPhase = ''
          mkdir -p $out/bin
          cp packages/cli/build/index.js $out/bin/index.js
        '';
      };
    }
  );
}
