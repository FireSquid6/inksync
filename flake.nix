{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };
  outputs = { self, nixpkgs }: 
  let 
    pkgs = nixpkgs.legacyPackages.x86_64-linux; 
  in { 
    devShells.x86_64-linux.default = pkgs.mkShell {
      buildInputs = with pkgs; [
        bun
        nodejs_20
        flyctl
        typescript

        # nativescript stuff
        jdk17

      ];
      shellHook =''
        unset QT_PLUGIN_PATH
        unset QML2_IMPORT_PATH
      '';
    };
  };
}
