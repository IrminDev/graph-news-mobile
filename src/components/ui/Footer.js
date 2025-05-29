import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

const Footer = ({ darkMode }) => {
  const footerSections = [
    {
      title: 'Company',
      links: ['About', 'Team', 'Careers', 'Blog']
    },
    {
      title: 'Product',
      links: ['Features', 'Pricing', 'API', 'Documentation']
    },
    {
      title: 'Resources',
      links: ['Tutorials', 'Examples', 'Community', 'Research']
    },
    {
      title: 'Legal',
      links: ['Privacy', 'Terms', 'Security', 'Cookies']
    }
  ];

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: darkMode ? '#0f172a' : '#ffffff',
        borderTopColor: darkMode ? 'rgba(100, 116, 139, 0.3)' : 'rgba(148, 163, 184, 0.3)',
      }
    ]}>
      <View style={styles.content}>
        <View style={styles.sectionsContainer}>
          {footerSections.map((section, index) => (
            <View key={index} style={styles.section}>
              <Text style={[
                styles.sectionTitle,
                { color: darkMode ? '#ffffff' : '#1e293b' }
              ]}>
                {section.title}
              </Text>
              {section.links.map((link, linkIndex) => (
                <TouchableOpacity key={linkIndex} style={styles.linkContainer}>
                  <Text style={[
                    styles.link,
                    { color: darkMode ? '#94a3b8' : '#64748b' }
                  ]}>
                    {link}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>

        <View style={[
          styles.bottomSection,
          { borderTopColor: darkMode ? 'rgba(100, 116, 139, 0.3)' : 'rgba(148, 163, 184, 0.3)' }
        ]}>
          <View style={styles.brandSection}>
            <Icon
              name="share-2"
              size={20}
              color={darkMode ? '#6366f1' : '#4f46e5'}
              style={styles.brandIcon}
            />
            <Text style={[
              styles.brandText,
              { color: darkMode ? '#ffffff' : '#1e293b' }
            ]}>
              GraphNova
            </Text>
          </View>
          <Text style={[
            styles.copyright,
            { color: darkMode ? '#94a3b8' : '#64748b' }
          ]}>
            © 2025 GraphNova. All rights reserved.
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    paddingTop: 40,
    paddingBottom: 20,
  },
  content: {
    paddingHorizontal: 20,
  },
  sectionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  section: {
    width: '48%',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  linkContainer: {
    marginBottom: 8,
  },
  link: {
    fontSize: 14,
    lineHeight: 20,
  },
  bottomSection: {
    borderTopWidth: 1,
    paddingTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandIcon: {
    marginRight: 8,
  },
  brandText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  copyright: {
    fontSize: 12,
  },
});

export default Footer;