import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

const faqItems = [
  {
    question: 'How does pre-ordering work?',
    answer:
      'Add available products to your cart, select a market, pickup date and time slot, then place the reservation.',
  },
  {
    question: 'Do I pay online?',
    answer:
      'No. MarketLink does not process payments. You pay the farmer directly when collecting your order.',
  },
  {
    question: 'Can I cancel or modify an order?',
    answer:
      "Yes, while the order is still before the farmer's configured cutoff time.",
  },
  {
    question: 'Can I order from multiple farmers?',
    answer:
      'Yes. The cart can contain products from multiple farmers; reservations are grouped by farmer for pickup.',
  },
  {
    question: 'How are farmers approved?',
    answer:
      'Farmer registrations are reviewed by an administrator before they can actively list products.',
  },
  {
    question: 'Can I save favorite farmers and products?',
    answer:
      'Yes. Favorite products, farmers and markets are available from the customer dashboard.',
  },
  {
    question: 'What happens if stock changes?',
    answer:
      'Farmers can mark products sold out or temporarily unavailable and update weekly quantities.',
  },
  {
    question: 'How do pickup slots work?',
    answer:
      'Each farmer defines pickup windows and an order cutoff. Checkout checks the market day and shared farmer slot.',
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);

  function toggleQuestion(index) {
    setOpenIndex((currentIndex) =>
      currentIndex === index ? -1 : index
    );
  }

  return (
    <div className="page container narrow">
      <div className="page-intro center">
        <div className="eyebrow">
          HELP CENTRE
        </div>
        <h1>Frequently asked questions</h1>
        <p>
          Everything you need to know about reservations
          and market pickup.
        </p>
      </div>

      <div className="faq-list">
        {faqItems.map((item, index) => {
          const isOpen = openIndex === index;

          return (
            <div
              className={`faq-item ${isOpen ? 'open' : ''}`}
              key={item.question}
            >
              <button
                onClick={() => toggleQuestion(index)}
              >
                <span>{item.question}</span>
                <ChevronDown />
              </button>

              {isOpen && (
                <p>{item.answer}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
