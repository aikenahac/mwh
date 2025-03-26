"use client";

import { useParams } from "next/navigation";

export function DeckDetails() {
  const { id: deckId } = useParams<{ id: string }>();


  return (
    <div>
      <h1 className='text-2xl font-bold'>Deck Details</h1>
      <p>Deck ID: {deckId}</p>
    </div>
  );
}
