const fs = require('fs')
const qpdf = require('node-qpdf2')
const { createInterface } = require('readline')
const path = require('path')
const { promisify } = require('util')

const clearConsole = () => console.clear() 

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
})

const question = promisify(rl.question).bind(rl)

const getFolder = async() => {
  const folders = fs.readdirSync(`${process.cwd()}`).filter(file => fs.lstatSync(file).isDirectory())
  if (!folders) {
    console.log('No se encontro una carpeta con archivos en esta carpeta')
    await question('Presiona enter para salir', () => rl.close())
    process.exit()
  }
  clearConsole()
  console.log(`Carpetas: ${folders}`)
  folders.forEach((folder, index) => console.log(`${index+1}. ${folder}`))
  const folderIndex = await question('Seleccione la carpeta a utilizar: ')
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
    await question('Presiona enter para salir', () => rl.close())
    process.exit()
  }
  const filesMap = files.reduce((acc, file) => {
    const number = file.split('_')[1].split('.')[0]
    acc[number] = file
    return acc
  }, {})
  clearConsole()
  consecutiveAndCedula.forEach(async([consecutive, cedula]) => {
    console.log(`${path.resolve(process.cwd())}/${filesMap[consecutive]}`)
    await qpdf.encrypt(path.win32.resolve(process.cwd()+'/'+filesMap[consecutive]), {keyLength: 256, cedula: cedula.slice(-4) }, path.win32.resolve(process.cwd()+`/${cedula}.pdf`))
    fs.unlinkSync(`${path.resolve(process.cwd())}/${filesMap[consecutive]}`)
  })

  await question('Presiona enter para salir ', () => rl.close())
  process.exit()
}

main()
