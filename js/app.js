import { startReport, pollReport } from './api.js'
import {
  renderAddressForm,
  renderLoadingReport,
  renderErrorView,
  renderReportView,
} from './render.js'

const root = document.getElementById('app')

let state = { status: 'idle' }

function setState(next) {
  state = next
  render()
}

function render() {
  if (state.status === 'idle') {
    root.innerHTML = renderAddressForm({ disabled: false })
    wireAddressForm()
  } else if (state.status === 'loading') {
    root.innerHTML = renderLoadingReport(state.address)
  } else if (state.status === 'error') {
    root.innerHTML = renderErrorView(state.message)
    document.getElementById('error-reset').addEventListener('click', () => {
      setState({ status: 'idle' })
    })
  } else if (state.status === 'report') {
    root.innerHTML = renderReportView(state.report)
    document.getElementById('report-reset').addEventListener('click', () => {
      setState({ status: 'idle' })
    })
    document.getElementById('report-print').addEventListener('click', () => {
      window.print()
    })
  }
}

function wireAddressForm() {
  const form = document.getElementById('address-form')
  const input = document.getElementById('address-input')
  const submit = document.getElementById('address-submit')

  function syncSubmitState() {
    submit.disabled = input.value.trim().length < 4
  }
  syncSubmitState()
  input.addEventListener('input', syncSubmitState)

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const trimmed = input.value.trim()
    if (trimmed.length < 4) return
    await handleSubmit(trimmed)
  })
}

async function handleSubmit(address) {
  setState({ status: 'loading', address })
  try {
    const pending = await startReport(address)
    const report = await pollReport(pending.id)
    setState({ status: 'report', report })
  } catch (err) {
    setState({
      status: 'error',
      address,
      message: err instanceof Error ? err.message : 'Something went wrong opening this file.',
    })
  }
}

render()
