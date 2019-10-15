import React from 'react';
import './header.pcss';

const Header = () => (
    <div className="widget-popup__header">
        <div className="widget-popup__header-logo" />
        <div className="widget-popup__header-btns" id="popup-header-buttons">
            <span className="widget-popup__header-title">Assistant</span>
            <button
                className="cir-btn pause"
                title="Pause AdGuard protection"
            >
                <img src="../../../assets/images/icon-pause.svg" alt="" />
            </button>
            <button
                className="cir-btn start"
                title="Resume AdGuard protection"
            >
                <img src="../../../assets/images/icon-start.svg" alt="" />
            </button>
            <button
                className="cir-btn settings"
                title="AdGuard Settings"
            >
                <img src="../../../assets/images/icon-settings.svg" alt="" />
            </button>
        </div>
    </div>
);

export default Header;
