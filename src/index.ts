import * as core from '@actions/core'
import * as toolCache from '@actions/tool-cache'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import os from 'node:os'
import path from 'node:path'
import { chmod, mkdir, rm, symlink } from 'fs/promises'
import { existsSync } from 'fs'

const doExec = promisify(exec)

const currentBinaryName = 'postgres-language-server'
const legacyBinaryName = 'postgrestools'

const platformMappings = {
  darwin: 'darwin',
  linux: 'unknown-linux-gnu',
  win32: 'pc-windows-msvc'
}

const archMappings = {
  arm64: 'aarch64',
  x64: 'x86_64'
}

async function urlExists(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' })
    return response.ok
  } catch {
    return false
  }
}

function getArch() {
  const arch = os.arch()
  for (const [nodeArch, rustArch] of Object.entries(archMappings)) {
    if (nodeArch === arch) {
      return rustArch
    }
  }
  throw new Error(
    `Unsupported arch: ${arch}. We currently only support: ${Object.keys(
      archMappings
    ).join(', ')}`
  )
}

function getPlatform() {
  const platform = os.platform()
  for (const [nodePlatform, rustPlatform] of Object.entries(platformMappings)) {
    if (nodePlatform === platform) {
      return rustPlatform
    }
  }
  throw new Error(
    `Unsupported platform: ${platform}. We currently only support: ${Object.keys(
      platformMappings
    ).join(', ')}`
  )
}

function getFileName(binary: string): string {
  const platform = getPlatform()
  const arch = getArch()

  return `${binary}_${arch}-${platform}`
}

function getDownloadUrl(version: string, binary: string): string {
  const filename = getFileName(binary)

  if (version.toLowerCase() === 'latest') {
    return `https://github.com/supabase-community/postgres-language-server/releases/latest/download/${filename}`
  } else {
    return `https://github.com/supabase-community/postgres-language-server/releases/download/${version}/${filename}`
  }
}

async function determineInstalledVersion(): Promise<string> {
  const binaries = [currentBinaryName, legacyBinaryName]

  for (const binary of binaries) {
    try {
      const { stdout } = await doExec(`${binary} --version`)
      const version = stdout.trim()

      if (version) {
        return version
      }
    } catch {
      continue
    }
  }

  throw new Error(
    'Could not determine installed Postgres Language Server version'
  )
}

async function main() {
  try {
    const version = core.getInput('version', { required: true })

    let url = getDownloadUrl(version, currentBinaryName)
    if (!(await urlExists(url))) {
      url = getDownloadUrl(version, legacyBinaryName)
    }

    const tool = await toolCache.downloadTool(url)

    await chmod(tool, '755')

    const binDir = path.join(process.env.HOME!, 'bin')
    if (!existsSync(binDir)) {
      core.info(`Binary dir not found. Creating one at ${binDir}`)
      await mkdir(binDir, { recursive: true })
    }

    const binarySymlinkPath = path.join(binDir, currentBinaryName)
    await rm(binarySymlinkPath, { force: true })
    await symlink(tool, binarySymlinkPath)

    const legacySymlinkPath = path.join(binDir, legacyBinaryName)
    await rm(legacySymlinkPath, { force: true })
    await symlink(tool, legacySymlinkPath)

    core.info(`Adding to path: ${binDir}`)
    core.addPath(binDir)

    const installedVersion = await determineInstalledVersion()
    core.setOutput('installed-version', installedVersion)
  } catch (err) {
    if (err instanceof Error) {
      core.setFailed(err.message)
    } else {
      core.setFailed('An unknown error occurred')
    }
  }
}
main().then(() => process.exit(0))
