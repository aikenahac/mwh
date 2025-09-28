'use client';

import { Card } from '@/lib/supabase/api/card';
import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { chunkArray } from '@/lib/utils';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 15,
    paddingTop: 15,
    gap: 6,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  card: {
    height: 249.48, // 8.8cm
    width: 178.605, // 6.3cm
    padding: 12,
    borderRadius: 8,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    border: '1px solid #ccc',
  },
  backCard: {
    height: 249.48, // 8.8cm
    width: 178.605, // 6.3cm
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'black',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    border: '1px solid #ccc',
  },
  cardWhite: {
    backgroundColor: 'white',
    color: 'black',
  },
  cardBlack: {
    backgroundColor: 'black',
    color: 'white',
  },
  cardText: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Helvetica',
    lineHeight: 1.3,
  },
  backCardText: {
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: 'Helvetica',
    color: 'white',
    textAlign: 'left',
    paddingLeft: 4,
    paddingTop: 4,
  },
  cardFooter: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  cardFooterText: {
    fontSize: 8,
    fontWeight: 'bold',
  },
  cardFooterSpecialty: {
    color: 'white',
    fontWeight: 'bold',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardFooterSpecialtyCircle: {
    height: 20,
    width: 20,
    borderRadius: 100,
    backgroundColor: 'white',
    color: 'black',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 10,
  },
});

export function PrintDocument({ cards }: { cards?: Array<Card> }) {
  const cardsPerPage = 4; // 4 columns x 1 row in landscape (6.3cm x 8.8cm cards)
  const chunkedCards = chunkArray(cards || [], cardsPerPage);

  // Create alternating array of cards and back cards
  const createAlternatingCards = (cardChunk: Card[]) => {
    const alternatingElements = [];
    for (let i = 0; i < cardChunk.length; i++) {
      // Add the actual card
      alternatingElements.push({ type: 'card', data: cardChunk[i] });
      // Add back card after every card (so every second element is a back card)
      alternatingElements.push({ type: 'back', data: null });
    }
    return alternatingElements;
  };

  return (
    <Document>
      {chunkedCards.map((chunk, pageIndex) => {
        const alternatingElements = createAlternatingCards(chunk);

        return (
          <Page size="A4" orientation="landscape" key={`page-${pageIndex}`}>
            <View style={styles.page}>
              <View style={{ width: '100%', height: 1 }} />
              {alternatingElements.map((element, index) => {
                if (element.type === 'card' && element.data) {
                  const card = element.data as Card;
                  return (
                    <View
                      key={`card-${card.id}-${index}`}
                      style={{
                        ...styles.card,
                        ...(card.type === 'white'
                          ? styles.cardWhite
                          : styles.cardBlack),
                      }}
                    >
                      <Text style={styles.cardText}>{card.text}</Text>

                      <View style={styles.cardFooter}>
                        <Text style={styles.cardFooterText}>
                          Mess With Humanity
                        </Text>
                        {card.black_card_type === 'pick_2' && (
                          <View style={styles.cardFooterSpecialty}>
                            <Text style={{ fontSize: 8 }}>PICK</Text>
                            <View style={styles.cardFooterSpecialtyCircle}>
                              <Text style={{ fontSize: 10 }}>2</Text>
                            </View>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                } else {
                  return <BackCardComponent key={`back-${index}`} />;
                }
              })}
            </View>
          </Page>
        );
      })}
    </Document>
  );
}

function BackCardComponent() {
  return (
    <View style={styles.backCard}>
      <Text style={styles.backCardText}>Mess{'\n'}With{'\n'}Humanity</Text>
    </View>
  );
}
