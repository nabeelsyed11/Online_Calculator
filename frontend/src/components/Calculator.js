import React, { useState } from 'react';

function Calculator() {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState(null);
  const [operation, setOperation] = useState(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [serverExpression, setServerExpression] = useState('');
  const [serverResult, setServerResult] = useState(null);
  const [serverError, setServerError] = useState('');

  const inputNumber = (num) => {
    if (waitingForOperand) {
      setDisplay(String(num));
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? String(num) : display + num);
    }
  };

  const inputOperator = (nextOperator) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const currentValue = previousValue || 0;
      const newValue = calculate(currentValue, inputValue, operation);

      setDisplay(String(newValue));
      setPreviousValue(newValue);
    }

    setWaitingForOperand(true);
    setOperation(nextOperator);
  };

  const calculate = (firstValue, secondValue, operation) => {
    switch (operation) {
      case '+':
        return firstValue + secondValue;
      case '-':
        return firstValue - secondValue;
      case '*':
        return firstValue * secondValue;
      case '/':
        return firstValue / secondValue;
      case '%':
        return firstValue % secondValue;
      default:
        return secondValue;
    }
  };

  const performCalculation = () => {
    const inputValue = parseFloat(display);

    if (previousValue !== null && operation) {
      const newValue = calculate(previousValue, inputValue, operation);
      setDisplay(String(newValue));
      setPreviousValue(null);
      setOperation(null);
      setWaitingForOperand(true);
    }
  };

  const clear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
  };

  const inputDecimal = () => {
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
    } else if (display.indexOf('.') === -1) {
      setDisplay(display + '.');
    }
  };

  const calculateOnServer = async () => {
    const expr = serverExpression.trim();
    if (!expr) return;
    setServerError('');
    setServerResult(null);
    try {
      const res = await fetch('/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expression: expr })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Calculation failed');
      setServerResult(json.result);
    } catch (e) {
      setServerError(e.message);
    }
  };

  return (
    <div className="calculator">
      <div className="display">{display}</div>
      <div className="buttons">
        <button className="button clear" onClick={clear}>C</button>
        <button className="button" onClick={() => inputNumber(7)}>7</button>
        <button className="button" onClick={() => inputNumber(8)}>8</button>
        <button className="button" onClick={() => inputNumber(9)}>9</button>
        <button className="button operator" onClick={() => inputOperator('/')}>/</button>

        <button className="button" onClick={() => inputNumber(4)}>4</button>
        <button className="button" onClick={() => inputNumber(5)}>5</button>
        <button className="button" onClick={() => inputNumber(6)}>6</button>
        <button className="button operator" onClick={() => inputOperator('*')}>*</button>

        <button className="button" onClick={() => inputNumber(1)}>1</button>
        <button className="button" onClick={() => inputNumber(2)}>2</button>
        <button className="button" onClick={() => inputNumber(3)}>3</button>
        <button className="button operator" onClick={() => inputOperator('-')}>-</button>

        <button className="button" onClick={() => inputNumber(0)}>0</button>
        <button className="button" onClick={inputDecimal}>.</button>
        <button className="button equals" onClick={performCalculation}>=</button>
        <button className="button operator" onClick={() => inputOperator('+')}>+</button>
      </div>

      <div style={{ textAlign: 'left', marginTop: 20 }}>
        <h3>Evaluate on server</h3>
        <p style={{ color: '#666' }}>Type an expression (supports parentheses, %, ^, etc.)</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            type="text"
            value={serverExpression}
            onChange={(e) => setServerExpression(e.target.value)}
            style={{ flex: 1, padding: 8, border: '1px solid #ccc', borderRadius: 4 }}
            placeholder="e.g., (12 + 8) / 5^2"
          />
          <button className="button equals" onClick={calculateOnServer}>
            Calculate
          </button>
        </div>
        {serverError && <p style={{ color: 'red' }}>{serverError}</p>}
        {serverResult !== null && (
          <p><strong>Result:</strong> {String(serverResult)}</p>
        )}
      </div>
    </div>
  );
}

export default Calculator;
