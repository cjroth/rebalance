import { demoScenarios } from '../lib/demo-portfolios.ts'
import { parsePortfolioCsv, buildSymbols, buildAccounts, buildHoldings } from '../screens/state.ts'

export function buildDemoData(scenarioIndex = 0) {
  const input = parsePortfolioCsv(demoScenarios[scenarioIndex]!.csv)
  const symbols = buildSymbols(input)
  const accounts = buildAccounts(input)
  const holdings = buildHoldings(input, symbols)
  return { input, symbols, accounts, holdings }
}
