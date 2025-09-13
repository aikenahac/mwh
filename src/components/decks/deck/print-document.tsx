'use client';

import { Card } from '@/lib/supabase/api/card';
import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  card: {
    height: 332.5984252,
    width: 238.11023622,
    padding: 26,
    rounded: 12,
    shadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
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
    fontSize: 24,
    fontWeight: 'extrabold',
    fontFamily: 'Helvetica'
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
    height: 24,
    width: 24,
    borderRadius: 100,
    backgroundColor: 'white',
    color: 'black',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }
});

export function PrintDocument({ cards }: { cards?: Array<Card> }) {
  return (
    <Document>
      <Page size="A4">
        {cards?.map((card) => (
          <View key={card.id} style={{
            ...styles.card,
            ...(card.type === 'white' ? styles.cardWhite : styles.cardBlack)
          }}>
            <Text style={styles.cardText}>{card.text}</Text>

            <View style={styles.cardFooter}>
              <Text style={styles.cardFooterText}>Mess With Humanity</Text>
              {card.black_card_type === 'pick_2' && (
                <View style={styles.cardFooterSpecialty}>
                  <Text>PICK</Text>
                  <View style={styles.cardFooterSpecialtyCircle}>
                    2
                  </View>
                </View>
              )}
            </View>
          </View>
        ))}
      </Page>
    </Document>
  );
}
