import { Directory } from "@capacitor/filesystem";
import { MobileFilesystem } from "../lib/filesystem";

export function TestComponent() {
  const onClick = async () => {
    console.log("click function called");
    try {
      const filesystem = new MobileFilesystem("MyCoolDirectory", Directory.Documents);
      console.log("made the filesystem");

      await filesystem.writeTo("myFile.txt", "Hello, world! This was writting from typescript!");

    } catch (e) {
      if (e instanceof Error) {
        console.log("Caught handleable error");
        console.log(e.name);
        console.log(e.message);
        console.log(e.stack);
        console.log(e.cause);
      } else {
        console.log("Caught unhandleable error");
        console.log(e);
      }
    }

  }

  return (
    <button className="btn btn-primary" onClick={onClick}>
      Do the thing!
    </button>
  )

}
