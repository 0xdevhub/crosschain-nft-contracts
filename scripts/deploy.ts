import { Spinner } from './spinner'
import cliSpinner from 'cli-spinners'

const spinner: Spinner = new Spinner(cliSpinner.triangle)

const deploy = async () => {
  // deploy hub contract
  console.log(`ℹ️  Deploying...`)

  console.log(`✅ deployed`)
}

;(async () => {
  try {
    spinner.start()
    await deploy()
    spinner.stop()
  } catch (error) {
    console.error(error)
    process.exitCode = 1
    spinner.stop()
  }
})()
