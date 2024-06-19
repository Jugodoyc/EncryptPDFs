const fs = require('fs')
const qpdf = require('node-qpdf2')
const { createInterface } = require('readline/promises')
const path = require('path')

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
  if(!fs.existsSync(`${process.cwd()}/${folder}/salida`)) {
    fs.mkdirSync(`${process.cwd()}/${folder}/salida`)
  }
  for(let i = 0; i < consecutiveAndCedula.length; i++) {
    const [consecutive, cedula] = consecutiveAndCedula[i]
    const muestraPath = path.win32.resolve(`${process.cwd()}/${folder}/${filesMap[consecutive]}`)
    const pdfPath = path.win32.resolve(process.cwd()+`/${folder}/salida/${cedula}.pdf`)
    console.log(`Procesando ${muestraPath} - ${pdfPath}`)
    await qpdf.encrypt(muestraPath, {keyLength: 256, password: cedula.slice(-4) }, pdfPath)
  }
  await rl.question('Proceso Completado Presiona enter para salir ', () => rl.close())
  process.exit()
}

const init = async() => {
  console.log('Bienvenido al programa de encriptación de PDFs')
  await rl.question('Presiona enter para salir', () => rl.close())
  try {
    main()
  } catch (error) {
    console.log(error.message)
    await rl.question('Presiona enter para salir', () => rl.close())
    process.exit()
  }
}

init()
