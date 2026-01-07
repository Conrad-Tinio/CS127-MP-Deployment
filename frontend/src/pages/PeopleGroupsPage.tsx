import { useEffect, useState } from 'react'
import { personApi, groupApi } from '../services/api'
import type { Person, Group } from '../types'
import { 
  User, 
  Users, 
  Plus, 
  Search,
  UserPlus,
  Loader2,
  X
} from 'lucide-react'

export default function PeopleGroupsPage() {
  const [persons, setPersons] = useState<Person[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'people' | 'groups'>('people')
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [showCreatePerson, setShowCreatePerson] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [newPersonName, setNewPersonName] = useState('')
  const [creatingGroup, setCreatingGroup] = useState(false)
  const [creatingPerson, setCreatingPerson] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [personsRes, groupsRes] = await Promise.all([
        personApi.getAll(),
        groupApi.getAll()
      ])
      setPersons(personsRes.data)
      setGroups(groupsRes.data)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      alert('Please enter a group name')
      return
    }

    setCreatingGroup(true)
    try {
      await groupApi.create({ groupName: newGroupName.trim(), members: [] })
      setNewGroupName('')
      setShowCreateGroup(false)
      loadData()
    } catch (error) {
      console.error('Error creating group:', error)
      alert('Error creating group. Please try again.')
    } finally {
      setCreatingGroup(false)
    }
  }

  const handleCreatePerson = async () => {
    if (!newPersonName.trim()) {
      alert('Please enter a person name')
      return
    }

    setCreatingPerson(true)
    try {
      await personApi.create({ fullName: newPersonName.trim() })
      setNewPersonName('')
      setShowCreatePerson(false)
      loadData()
    } catch (error) {
      console.error('Error creating person:', error)
      alert('Error creating person. Please try again.')
    } finally {
      setCreatingPerson(false)
    }
  }

  const filteredPersons = persons.filter(p => 
    p.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredGroups = groups.filter(g => 
    g.groupName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin"></div>
          <p className="text-dark-400">Loading contacts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-enter space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-dark-50">People & Groups</h1>
          <p className="mt-1 text-dark-400">Manage your contacts and groups.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="glass-card p-2 inline-flex gap-2">
        <button
          onClick={() => setActiveTab('people')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all ${
            activeTab === 'people'
              ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
              : 'text-dark-400 hover:text-dark-200 hover:bg-dark-800/50'
          }`}
        >
          <User className="w-5 h-5" />
          People ({persons.length})
        </button>
        <button
          onClick={() => setActiveTab('groups')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all ${
            activeTab === 'groups'
              ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
              : 'text-dark-400 hover:text-dark-200 hover:bg-dark-800/50'
          }`}
        >
          <Users className="w-5 h-5" />
          Groups ({groups.length})
        </button>
      </div>

      {/* Search and Actions */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
        </div>
        {activeTab === 'people' ? (
          <button
            onClick={() => setShowCreatePerson(true)}
            className="btn-primary"
          >
            <UserPlus className="w-5 h-5" />
            Add Person
          </button>
        ) : (
          <button
            onClick={() => setShowCreateGroup(true)}
            className="btn-primary"
          >
            <Plus className="w-5 h-5" />
            Create Group
          </button>
        )}
      </div>

      {/* Create Person Modal */}
      {showCreatePerson && (
        <div className="glass-card p-6 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-dark-100">Add New Person</h3>
            <button
              onClick={() => setShowCreatePerson(false)}
              className="p-2 hover:bg-dark-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-dark-400" />
            </button>
          </div>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
              <input
                type="text"
                value={newPersonName}
                onChange={(e) => setNewPersonName(e.target.value)}
                placeholder="Enter person's full name"
                className="input-field pl-10"
                onKeyPress={(e) => e.key === 'Enter' && handleCreatePerson()}
                autoFocus
              />
            </div>
            <button
              onClick={handleCreatePerson}
              disabled={creatingPerson || !newPersonName.trim()}
              className="btn-primary"
            >
              {creatingPerson ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Add'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateGroup && (
        <div className="glass-card p-6 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-dark-100">Create New Group</h3>
            <button
              onClick={() => setShowCreateGroup(false)}
              className="p-2 hover:bg-dark-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-dark-400" />
            </button>
          </div>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Enter group name"
                className="input-field pl-10"
                onKeyPress={(e) => e.key === 'Enter' && handleCreateGroup()}
                autoFocus
              />
            </div>
            <button
              onClick={handleCreateGroup}
              disabled={creatingGroup || !newGroupName.trim()}
              className="btn-primary"
            >
              {creatingGroup ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Create'
              )}
            </button>
          </div>
          <p className="mt-3 text-sm text-dark-500">
            You can add members to the group after creating it.
          </p>
        </div>
      )}

      {/* Content */}
      {activeTab === 'people' ? (
        <div className="space-y-3">
          {filteredPersons.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-dark-800 flex items-center justify-center">
                <User className="w-8 h-8 text-dark-500" />
              </div>
              <p className="text-dark-400 mb-4">
                {persons.length === 0 
                  ? "No people added yet. Add someone to get started!" 
                  : "No people match your search."}
              </p>
              {persons.length === 0 && (
                <button onClick={() => setShowCreatePerson(true)} className="btn-primary">
                  <UserPlus className="w-5 h-5" />
                  Add Your First Person
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPersons.map((person, index) => (
                <div 
                  key={person.personId} 
                  className="glass-card p-4 flex items-center gap-4 hover:border-dark-600 transition-all stagger-item"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-lg font-bold text-white">
                    {person.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-dark-100 truncate">{person.fullName}</p>
                    <p className="text-sm text-dark-500">Contact</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredGroups.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-dark-800 flex items-center justify-center">
                <Users className="w-8 h-8 text-dark-500" />
              </div>
              <p className="text-dark-400 mb-4">
                {groups.length === 0 
                  ? "No groups created yet. Create one to get started!" 
                  : "No groups match your search."}
              </p>
              {groups.length === 0 && (
                <button onClick={() => setShowCreateGroup(true)} className="btn-primary">
                  <Plus className="w-5 h-5" />
                  Create Your First Group
                </button>
              )}
            </div>
          ) : (
            filteredGroups.map((group, index) => (
              <div 
                key={group.groupId} 
                className="glass-card p-6 stagger-item"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-dark-100">{group.groupName}</h3>
                      <p className="text-sm text-dark-500">{group.members.length} members</p>
                    </div>
                  </div>
                </div>
                
                {group.members.length === 0 ? (
                  <p className="text-dark-500 text-sm italic">No members yet</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {group.members.map((member) => (
                      <div 
                        key={member.personId}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-dark-800/50 rounded-lg text-sm"
                      >
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-xs font-bold text-dark-950">
                          {member.fullName.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-dark-300">{member.fullName}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
