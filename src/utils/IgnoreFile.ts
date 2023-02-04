import fs from 'fs';

interface DataObjectType {
  appid: number;
  found?: boolean;
}

type DataType = DataObjectType | DataObjectType[];

export default class IgnoreFile {
  private ignoreData: Array<DataObjectType> = [];
  private tempDir = '/temp/steamGamesCache.json';

  constructor(data?: DataType, tempDir?: string) {
    try {
      this.setTempDir(tempDir);
      this.loadTemp(this.tempDir);
      if (data) this.add(data);
    } catch {
      this.saveTemp();
    }
  }

  get getStringData() {
    return JSON.stringify(this.ignoreData);
  }

  setTempDir(customTempDir: string = this.tempDir) {
    this.tempDir = customTempDir;
  }

  add(data: DataType) {
    if (data instanceof Array) {
      data.forEach(dataObj => this.ignoreData.push(dataObj));
    } else {
      this.ignoreData.push(data);
    }
  }

  find(appid: number) {
    return this.ignoreData.find(elem => elem.appid === appid);
  }

  remove(appid: number) {
    const newData: DataType = this.ignoreData.filter(el => {
      if (el.appid !== appid) return el;
    });
    this.ignoreData = newData;
  }

  loadTemp(customTempDir?: string) {
    this.setTempDir(customTempDir);
    const tempIgnoreData = JSON.parse(
      fs.readFileSync(this.tempDir, {
        encoding: 'utf8',
      }),
    );
    this.add(tempIgnoreData);
  }

  saveTemp(customTempDir?: string) {
    this.setTempDir(customTempDir);
    fs.writeFileSync(this.tempDir, this.getStringData);
  }
}
