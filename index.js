const fs = require('node:fs')
const qpdf = require('node-qpdf2')
const { createInterface } = require('node:readline/promises')
const path = require('node:path')

const clearConsole = () => console.clear() 

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
})

const getFolder = async() => {
  const folders = fs.readdirSync(`${process.cwd()}`).filter(file => fs.lstatSync(file).isDirectory())
  if (!folders) {
    console.log('No se encontro una carpeta con archivos en esta carpeta')
    await rl.question('Presiona enter para salir', () => rl.close())
    process.exit()
  }
  clearConsole()
  console.log(`Carpetas: ${folders}`)
  folders.forEach((folder, index) => console.log(`${index+1}. ${folder}`))
  const folderIndex = await rl.question('Seleccione la carpeta a utilizar: ')
  clearConsole()
  return folders[folderIndex-1]
}

const main = async() => {
  const data = fs.readFileSync(`${process.cwd()}/MUESTRAS.csv`).toLocaleString()
  const parsedData = data.split('\n').map(x => x.split(',').map(y => y.split('"')[1] || y)).slice(1)
  const consecutiveAndCedula = parsedData.map(x => [x[0].split(' - ')[0], x[1]])
  const folder = await getFolder()
  const files = fs.readdirSync(`${process.cwd()}/${folder}`).filter(file => file.endsWith('.pdf'))
  if (!files) {
    console.log('No se encontraron pdfs en esta carpeta')
    await rl.question('Presiona enter para salir', () => rl.close())
    process.exit()
  }
  const filesMap = files.reduce((acc, file) => {
    const number = file.split('_')[1].split('.')[0]
    acc[number] = file
    return acc
  }, {})
  clearConsole()
  consecutiveAndCedula.forEach(async([consecutive, cedula]) => {
    await qpdf.encrypt(`${path.resolve(process.cwd())}/${filesMap[consecutive]}`, {keyLength: 256, cedula: cedula.slice(-4) }, `${path.resolve(process.cwd())}/${cedula}.pdf`)
    await fs.unlinkSync(`${path.resolve(process.cwd())}/${filesMap[consecutive]}`)
  })

  await rl.question('Presiona enter para salir ', () => rl.close())
  process.exit()
}

main()