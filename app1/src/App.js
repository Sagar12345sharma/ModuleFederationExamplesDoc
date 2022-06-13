import React, { useEffect } from 'react'

function loadComponent(scope, module) {
  return async () => {
    // Initializes the share scope. This fills it with known provided modules from this build and all remotes
    await __webpack_init_sharing__('default')
    const container = window[scope] // or get the container somewhere else
    // Initialize the container, it may provide shared modules
    await container.init(__webpack_share_scopes__.default)
    const factory = await window[scope].get(module)
    const Module = factory()
    return Module
  }
}

const urlCache = new Set()
const useDynamicScript = (url) => {
  const [ready, setReady] = React.useState(false)
  const [errorLoading, setErrorLoading] = React.useState(false)

  React.useEffect(() => {
    if (!url) return

    if (urlCache.has(url)) {
      setReady(true)
      setErrorLoading(false)
      return
    }

    setReady(false)
    setErrorLoading(false)

    const element = document.createElement('script')

    element.src = url
    element.type = 'text/javascript'
    element.async = true

    element.onload = () => {
      urlCache.add(url)
      setReady(true)
    }

    element.onerror = () => {
      setReady(false)
      setErrorLoading(true)
    }

    document.head.appendChild(element)

    return () => {
      urlCache.delete(url)
      document.head.removeChild(element)
    }
  }, [url])

  return {
    errorLoading,
    ready,
  }
}

const componentCache = new Map()
export const useFederatedComponent = (remoteUrl, scope, module) => {
  const key = `${remoteUrl}-${scope}-${module}`
  const [Component, setComponent] = React.useState(null)

  const { ready, errorLoading } = useDynamicScript(remoteUrl)
  React.useEffect(() => {
    if (Component) setComponent(null)
    // Only recalculate when key changes
  }, [key])

  React.useEffect(() => {
    if (ready && !Component) {
      const Comp = React.lazy(loadComponent(scope, module))
      componentCache.set(key, Comp)
      setComponent(Comp)
    }
    // key includes all dependencies (scope/module)
  }, [Component, ready, key])

  return { errorLoading, Component }
}

function App() {
  useEffect(() => {}, [])

  return (
    <div
      style={{
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
      }}
    >
      <h1>Dynamic System Host</h1>
      <h2>App 1</h2>
      <p>
        The Dynamic System will take advantage Module Federation{' '}
        <strong>remotes</strong> and <strong>exposes</strong>. It will no load
        components that have been loaded already.
      </p>
      <div style={{ marginTop: '2em' }}>
        {/* <React.Suspense fallback="Loading System">
          {errorLoading
            ? `Error loading module "${module}"`
            : FederatedComponent && <FederatedComponent />}
        </React.Suspense> */}
        {/* <System
          system={{
            url: 'http://localhost:3003/remoteEntry.js',
            scope: 'app3',
            module: './Widget',
          }}
        />
        <System
          system={{
            url: 'http://localhost:3002/remoteEntry.js',
            scope: 'app2',
            module: './Widget',
          }}
        /> */}
        <System />
      </div>
    </div>
  )
}

function System() {
  let ArrayOfServices = [
    {
      url: 'http://localhost:3002/remoteEntry.js',
      scope: 'app2',
      module: './Widget',
    },
    {
      url: 'http://localhost:3003/remoteEntry.js',
      scope: 'app3',
      module: './Widget',
    },
  ]

  // const {
  //   system,
  //   system: { url, scope, module },
  // } = props

  // if (!system || !scope || !url || !module) {
  //   return <h2>No system specified</h2>
  // }

  // const { Component: FederatedComponent, errorLoading } = useFederatedComponent(
  //   url,
  //   scope,
  //   module,
  // )

  return (
    <>
      {ArrayOfServices.map((obj) => {
        const {
          Component: FederatedComponent,
          errorLoading,
        } = useFederatedComponent(obj.url, obj.scope, obj.module)
        return (
          <React.Suspense fallback="Loading System">
            {errorLoading
              ? `Error loading module "${module}"`
              : FederatedComponent && <FederatedComponent />}
          </React.Suspense>
        )
      })}
    </>
  )
}

export default App
