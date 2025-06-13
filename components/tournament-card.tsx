import type React from "react"
import { Calendar, Users, MapPin, Clock, Award } from "lucide-react"

interface TournamentCardProps {
  title: string
  date: string
  location: string
  participants: number
  duration: string
  prize: string
}

export const TournamentCard: React.FC<TournamentCardProps> = ({
  title,
  date,
  location,
  participants,
  duration,
  prize,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <div className="flex items-center text-gray-600 text-sm mb-1">
        <Calendar className="h-4 w-4 mr-1" />
        {date}
      </div>
      <div className="flex items-center text-gray-600 text-sm mb-1">
        <MapPin className="h-4 w-4 mr-1" />
        {location}
      </div>
      <div className="flex items-center text-gray-600 text-sm mb-1">
        <Users className="h-4 w-4 mr-1" />
        {participants} Participants
      </div>
      <div className="flex items-center text-gray-600 text-sm mb-1">
        <Clock className="h-4 w-4 mr-1" />
        {duration}
      </div>
      <div className="flex items-center text-gray-600 text-sm">
        <Award className="h-4 w-4 mr-1" />
        Prize: {prize}
      </div>
    </div>
  )
}
