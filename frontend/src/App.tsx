import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import AllPaymentsPage from './pages/AllPaymentsPage'
import PeopleGroupsPage from './pages/PeopleGroupsPage'
import EntryDetailPage from './pages/EntryDetailPage'
import CreateEntryPage from './pages/CreateEntryPage'
import Layout from './components/Layout'

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/entries" element={<AllPaymentsPage />} />
          <Route path="/entries/new" element={<CreateEntryPage />} />
          <Route path="/entries/:id" element={<EntryDetailPage />} />
          <Route path="/people-groups" element={<PeopleGroupsPage />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App






