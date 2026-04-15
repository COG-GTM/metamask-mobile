import React, { createContext, useContext, useState } from 'react';






const PriceChartContext = createContext({
  isChartBeingTouched: false,
  setIsChartBeingTouched: () => {
    throw new Error(
      'setIsChartBeingTouched() was called but no PriceChartProvider was found in the component tree.'
    );
  }
});

export const usePriceChart = () => useContext(PriceChartContext);





export const PriceChartProvider = ({ children }) => {
  const [isChartBeingTouched, setIsChartBeingTouched] =
  useState(false);

  return (
    <PriceChartContext.Provider
      value={{ isChartBeingTouched, setIsChartBeingTouched }}>
      
      {children}
    </PriceChartContext.Provider>);

};

export default PriceChartContext;