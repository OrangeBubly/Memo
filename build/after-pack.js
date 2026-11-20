// electron-builder afterPack hook: stamps the app icon and version info into Memo.exe.
// Pure JavaScript (resedit), so it works when building on Windows, macOS or Linux without Wine.
const fs = require('fs');
const path = require('path');
const ResEdit = require('resedit');

function stamp(exePath, { version = '1.0.0', icon = path.join(__dirname, 'icon.ico') } = {}) {
  const exe = ResEdit.NtExecutable.from(fs.readFileSync(exePath), { ignoreCert: true });
  const res = ResEdit.NtExecutableResource.from(exe);

  const iconFile = ResEdit.Data.IconFile.from(fs.readFileSync(icon));
  const groups = ResEdit.Resource.IconGroupEntry.fromEntries(res.entries);
  const groupId = groups.length ? groups[0].id : 1;
  const lang = groups.length ? groups[0].lang : 1033;
  ResEdit.Resource.IconGroupEntry.replaceIconsForResource(res.entries, groupId, lang, iconFile.icons.map(i => i.data));

  const [maj, min, pat] = version.split('.').map(n => parseInt(n, 10) || 0);
  const vi = ResEdit.Resource.VersionInfo.fromEntries(res.entries)[0] || ResEdit.Resource.VersionInfo.createEmpty();
  vi.setFileVersion(maj, min, pat, 0, 1033);
  vi.setProductVersion(maj, min, pat, 0, 1033);
  vi.setStringValues({ lang: 1033, codepage: 1200 }, {
    FileDescription: 'Memo — memorize anything by heart',
    ProductName: 'Memo',
    CompanyName: 'OrangeBubly',
    LegalCopyright: 'Copyright © 2026 OrangeBubly',
    OriginalFilename: 'Memo.exe',
    InternalName: 'Memo',
    FileVersion: version,
    ProductVersion: version
  });
  vi.outputToResourceEntries(res.entries);
  res.outputResource(exe);
  fs.writeFileSync(exePath, Buffer.from(exe.generate()));
}

module.exports = async function afterPack(context) {
  if (context.electronPlatformName !== 'win32') return;
  const exe = path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.exe`);
  stamp(exe, { version: context.packager.appInfo.version });
  console.log('  • stamped icon + version info into', path.basename(exe));
};
module.exports.stamp = stamp;
