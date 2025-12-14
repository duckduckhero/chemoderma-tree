import React from 'react';
import './PhenotypeDetailsPanel.css';

/**
 * Side panel component that displays detailed information about a selected phenotype
 */
function PhenotypeDetailsPanel({ phenotype, isOpen, onClose }) {
  if (!isOpen || !phenotype) return null;

  const {
    name,
    cut_id,
    incidence,
    tti,
    management_prevention,
    drug_examples,
    drug_examples_raw,
  } = phenotype;

  return (
    <>
      {/* Backdrop */}
      <div className="panel-backdrop" onClick={onClose} />
      
      {/* Panel */}
      <div className="phenotype-details-panel">
        <div className="panel-header">
          <h2>{name}</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>
        
        <div className="panel-content">
          {cut_id && (
            <div className="detail-section">
              <h3>CUTID</h3>
              <p>{cut_id}</p>
            </div>
          )}
          
          {incidence && (
            <div className="detail-section">
              <h3>Incidence</h3>
              <p>{incidence}</p>
            </div>
          )}
          
          {tti && (
            <div className="detail-section">
              <h3>TTI (Time to Onset)</h3>
              <p>{tti}</p>
            </div>
          )}
          
          {management_prevention && (
            <div className="detail-section">
              <h3>Management & Prevention</h3>
              <p>{management_prevention}</p>
            </div>
          )}
          
          {(drug_examples || drug_examples_raw) && (
            <div className="detail-section">
              <h3>Drug Examples</h3>
              {drug_examples && Array.isArray(drug_examples) ? (
                <ul>
                  {drug_examples.map((drug, index) => (
                    <li key={index}>{drug}</li>
                  ))}
                </ul>
              ) : (
                <p>{drug_examples_raw}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default PhenotypeDetailsPanel;

